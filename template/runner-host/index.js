const Koa = require('koa');
const app = new Koa();

app.use(async (ctx) => {
  // Function 로드
  let func = null;
  try {
    const { main } = require('../function/main');
    func = main;
  } catch (ex) {
    ctx.body = ex;
    ctx.status = 404;
    return;
  }

  ctx.body = await func();
});

app.listen(3000);
