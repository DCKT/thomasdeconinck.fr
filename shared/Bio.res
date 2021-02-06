module GithubIcon = {
  @module("react-icons/io") @react.component
  external make: (~size: int) => React.element = "IoLogoGithub"
}

module TwitterIcon = {
  @module("react-icons/io") @react.component
  external make: (~size: int) => React.element = "IoLogoTwitter"
}

@react.component
let make = (~content) => {
  <div className="flex flex-row">
    <img src="http://placehold.it/100x100" className="rounded-full mr-4 w-16 h-16" />
    <div className="flex flex-col">
      <div>
        <div
          className="html font-serif bio"
          dangerouslySetInnerHTML={{
            "__html": content,
          }}
        />
      </div>
      <div className="flex flex-row gap-x-4 mt-2">
        <a
          href="https://github.com/DCKT"
          target="_blank"
          title="Github link"
          className="text-yellow-500">
          <GithubIcon size={26} />
        </a>
        <a
          href="https://twitter.com/DCK__"
          target="_blank"
          title="Twitter link"
          className="text-yellow-500">
          <TwitterIcon size={26} />
        </a>
      </div>
    </div>
  </div>
}

let default = make
