addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const newUrl = `http://3.231.104.36${url.pathname}${url.search}`
  return Response.redirect(newUrl, 302)
}
