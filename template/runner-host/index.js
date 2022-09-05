const Koa = require('koa');
const app = new Koa();

app.use(async (ctx) => {
  // Loading function
  try {
    const { main } = require('../function/main');
    ctx.body = await main(ctx.request);
  } catch (ex) {
    ctx.body = JSON.stringify(ex);
    ctx.status = 500;
  }
});

app.listen(3000);
