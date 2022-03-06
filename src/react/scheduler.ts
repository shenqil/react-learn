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
  // console.log(getCurrentTime(), deadline);
  return getCurrentTime() >= deadline;
}

export function getCurrentTime() {
  return performance.now();
}
