import {
  IoLogoGithub as GithubIcon,
  IoLogoTwitter as TwitterIcon,
} from "react-icons/io";

export default function Bio({ content, locale }) {
  return (
    <div className="flex flex-row">
      <img
        alt="Thomas Deconinck"
        src="/me.png"
        className="rounded-full mr-4 w-16 h-16"
      />
      <div className="flex flex-col">
        <div>
          <div
            className="html bio"
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </div>
        <div className="flex flex-row gap-x-4 mt-2">
          <a
            href="https://github.com/DCKT"
            target="_blank"
            title="Github link"
            className="text-orange"
          >
            <GithubIcon size={26} />
          </a>
          <a
            href="https://twitter.com/DCK__"
            target="_blank"
            title="Twitter link"
            className="text-orange"
          >
            <TwitterIcon size={26} />
          </a>
        </div>
      </div>
    </div>
  );
}
