# LongStack

`LongStack` 会在异常产生时自动附加前序调用堆栈，并支持过滤用户代码（模块）所产生的堆栈，帮助快速定位异步调用问题。

使用此模块时，Node.js 版本需大于 v8.2.x

## 安装

``` bash
npm i longstack
```

## 用法

``` js
const longstack = require('longstack');
longstack.enable([options]);
```
__options__:  
* __removeNativeCode__: 是否移除非用户代码产生的堆栈， *默认值为 false*    
* __maxAsyncDepth__: 最大异步调用栈深度， *默认值为 64*    

配置全局生效，只需在用户代码入口处开启即可。

__请注意：此模块启动后会造成性能损耗，性能敏感代码请勿使用此模块。__

## 例子

``` js
Promise.resolve(1).then(val => {
    setTimeout(()=>{
        try {
            ThisMayThrowError;
        } catch(err) {
            console.error(err);
        };
    }, 1000);
});
```

上面的代码执行后会打印出如下错误：

> ReferenceError: ThisMayThrowError is not defined  
>    at Timeout.setTimeout [as \_onTimeout]  (test.js:8:13)  
>    at ontimeout (timers.js:427:11)  
>    at tryOnTimeout (timers.js:289:5)  
>    at listOnTimeout (timers.js:252:5)  
>    at Timer.processTimers (timers.js:212:10)  

Timeout.setTimeout 之前的执行堆栈都丢失了。
在开启 `LongStack` 后，会打印出从 loader 到当前模块的（异步）执行堆栈（如下所示）：

> ReferenceError: ThisMayThrowError is not defined  
>     at Timeout.setTimeout [as \_onTimeout] (test.js:8:13)  
>     at ontimeout (timers.js:427:11)  
>     at tryOnTimeout (timers.js:289:5)  
>     at listOnTimeout (timers.js:252:5)  
>     at Timer.processTimers (timers.js:212:10)  
>     at emitInitNative (internal/async_hooks.js:137:43)  
>     at emitInitScript (internal/async_hooks.js:336:3)  
>     at initAsyncResource (internal/timers.js:50:5)  
>     at new Timeout (internal/timers.js:82:3)  
>     at setTimeout (timers.js:403:19)  
>     at Promise.resolve.then.val (test.js:6:5)  
>     at process._tickCallback (internal/process/next_tick.js:178:7)  
>     at Function.Module.runMain (internal/modules/cjs/loader.js:721:11)  
>     at startup (internal/bootstrap/node.js:228:19)  
>     at PromiseWrap.emitInitNative (internal/async_hooks.js:137:43)  
>     at Promise.then (<anonymous>)  
>     at Object.<anonymous> (test.js:5:20)  
>     at Module._compile (internal/modules/cjs/loader.js:678:30)  
>     at Object.Module._extensions..js (internal/modules/cjs/loader.js:689:10)  
>     at Module.load (internal/modules/cjs/loader.js:589:32)  
>     at tryModuleLoad (internal/modules/cjs/loader.js:528:12)  
>     at Function.Module._load (internal/modules/cjs/loader.js:520:3)  
>     at Function.Module.runMain (internal/modules/cjs/loader.js:719:10)  

如果想过滤出用户（模块）代码，可以开启 `removeNativeCode` 选项，以便于查看与定位问题：

> ReferenceError: ThisMayThrowError is not defined  
>     at Timeout.setTimeout [as \_onTimeout] (test.js:10:13)  
>     at Promise.resolve.then.val (test.js:8:5)  
>     at Object.<anonymous> (test.js:7:20)  

