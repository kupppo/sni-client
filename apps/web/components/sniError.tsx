export default function SNIError({ error }: { error: Error }) {
  if (error.message.includes('Missing Filesystem Capabilities')) {
    return <div>Missing Filesystem Capabilities</div>
  }
  if (error.message.includes('No Connection')) {
    return (
      <article className="max-w-xl">
        <h1 className="mb-2 font-bold text-3xl">Cannot connect to SNI</h1>
        <p className="mb-12">
          Unfortunately, we cannot connect to SNI on your machine.
          <br />
          Here are some ideas to get everything up and running.
        </p>
        <h2 className="mb-1 font-bold text-xl">Verify that SNI is running</h2>
        <p className="mb-2">
          You should be able to see SNI in your taskbar / menubar / systray.
        </p>
        <p className="mb-12">
          If you do not see SNI here, please{' '}
          <a
            href="https://github.com/alttpo/sni/releases/latest"
            rel="noopener"
            target="_blank"
          >
            download the latest version
          </a>{' '}
          and follow the instructions{' '}
          <a
            href="https://github.com/alttpo/sni?tab=readme-ov-file#for-end-users"
            rel="noopener"
            target="_blank"
          >
            "For End Users"
          </a>{' '}
          in the README.
        </p>
        <h2 className="mb-1 font-bold text-xl">
          Ensure you are using the latest version
        </h2>
        <p className="mb-2">
          This client requires version{' '}
          <span className="font-mono text-sm">v0.0.89</span> or later.
        </p>
        <p className="mb-12">
          Please download and install{' '}
          <a
            href="https://github.com/alttpo/sni/releases/latest"
            rel="noopener"
            target="_blank"
          >
            the latest version
          </a>{' '}
          of SNI to make sure you are up to date.
        </p>
        <h2 className="mb-1 font-bold text-xl">Check your ad blocker</h2>
        <p className="mb-12">
          Ad blockers might try and block this website from connecting to SNI
          since it is running locally on your computer. Please configure your ad
          blocker to allow this site to access to{' '}
          <code className="text-primary/70 text-sm underline underline-offset-4">
            localhost:8190
          </code>{' '}
          or disable the ad blocker for this website.
        </p>
      </article>
    )
  }
  return <div>Unknown error</div>
}
