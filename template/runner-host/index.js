const Koa = require('koa');
const app = new Koa();

app.use(async (ctx) => {
  // Function 로드
  let func = null;
  try {
    const { main } = require('../function/main');
    func = main;
  } catch (ex) {
    ctx.status = 502;
    return ex;
  }

  ctx.body = await func(ctx.request);
});

app.listen(3000);
