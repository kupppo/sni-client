import { captureRouterTransitionStart, init } from '@sentry/nextjs'

init({
  dsn: 'https://a966e1ae42e2794871255e7fe2851a02@o4507844184834048.ingest.us.sentry.io/4508210706841600',
  tracesSampleRate: 0.1,
})

export const onRouterTransitionStart = captureRouterTransitionStart
