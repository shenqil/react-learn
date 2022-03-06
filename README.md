# 写在前面

+ **react fiber**通过链表，将任务碎片化了，在上一篇博客[React fiber](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%811-fiber)中，使用[window.requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) 让浏览器在空闲时间执行碎片化的计算渲染任务，但是 IE和Safari浏览器，目前并不支持该Api.所以需要我们自己实现scheduler,来执行已经碎片化的任务
+ 大致思路就是，给每个任务根据优先级不同，在每次Event Loop中设置可用时间，时间到了，任务停止。先让浏览器渲染，没执行完的任务，下一次EventLoop接着执行，保证用户交互的流畅性
+ 先看 scheduler 流程图
![scheduler.png](https://upload-images.jianshu.io/upload_images/25820166-eb2bb8c0d37dcc5c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
+ 本次代码在[源码1](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%811-fiber)的基础上完成

***

# 创建 `src\react\scheduler.ts`

```
/* eslint-disable @typescript-eslint/no-use-before-define */

const taskQueue:Array<{ callback:Function }> = [];
const timerQueue:Function[] = [];

let deadline = 0;
const threshold = 5;

export function schedulerCallback(callback:Function) {
  const newTask = { callback };
  taskQueue.push(newTask);
  schedule(flushWork);
}

export function schedule(callback:Function) {
  timerQueue.push(callback);
  postMessage();
}

function postMessage() {
  const { port1, port2 } = new MessageChannel();

  port1.onmessage = () => {
    const tem = timerQueue.splice(0, timerQueue.length);
    tem.forEach((fn) => fn());
  };

  port2.postMessage(undefined);
}

function flushWork() {
  // 记录当前时间
  deadline = getCurrentTime() + threshold;

  const currentTask = taskQueue[0];
  if (currentTask) {
    const { callback } = currentTask;
    let flag = true;
    while (flag) {
      if (callback()) {
        // taskLoop 执行完毕，退出循环
        flag = false;
      } else if (shouldYield()) {
        // 给定运行时间消耗完毕，退出循环
        flag = false;

        // 重新添加到调度中，下次执行
        schedulerCallback(callback);
      }
    }

    taskQueue.shift();
  }
}

export function shouldYield() {
  return getCurrentTime() >= deadline;
}

export function getCurrentTime() {
  return performance.now();
}
```

+ 代码比较少，逻辑就是上面画的流程图
+ MessageChannel 类似与 `setTimeout` ,但是比setTimeout先执行

# 修改 `src\react\ReactFiberWorkLoop.ts`

```
export function scheduleUpdateOnFiber(fiber:any) {
  wipRoot = fiber;
  wipRoot.sibling = null;
  nextUnitOfwork = wipRoot;
  schedulerCallback(workLoop);
}

// 使用自己实现的调度，返回值：true 执行完成, false 还没有执行完成
function workLoop() {
  if (nextUnitOfwork) {
    nextUnitOfwork = performUnitOfWork(nextUnitOfwork);

  } else {
    if (wipRoot) {
      commitRoot();
    }

    return true;
  }

  return false;
}
```

[源码](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%812-scheduler)
