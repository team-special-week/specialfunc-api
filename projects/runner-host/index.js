const fastify = require('fastify')()


async function runtime(req) {
  try {
    const { main } = require('../function/main')
    const result = await main(req);
    return result;
  } catch(ex) {
    return null;
  }
}

fastify.get('/*', async (request, reply) => {
  return runtime(request); 
})

fastify.post('/*', async (request, reply) => {
  return runtime(request); 
})

fastify.patch('/*', async (request, reply) => {
  return runtime(request); 
})

fastify.put('/*', async (request, reply) => {
  return runtime(request); 
})

fastify.delete('/*', async (request, reply) => {
  return runtime(request); 
})


// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()