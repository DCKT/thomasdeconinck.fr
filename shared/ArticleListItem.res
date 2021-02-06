module Link = {
  @module("next/link") @react.component
  external make: (~href: string, ~children: React.element) => React.element = "default"
}

module Intl = {
  type t

  @new
  external dateTimeFormat: (string, Js.t<'a>) => t = "Intl.DateTimeFormat"

  @send
  external format: (t, Js.Date.t) => string = "format"
}

@react.component
let make = (~title, ~description, ~date, ~slug, ~locale) => {
  let formattedDate = Intl.dateTimeFormat(
    locale,
    {
      "dateStyle": "full",
    },
  )->Intl.format(Js.Date.fromString(date))

  <div className="mb-6">
    <h3 className="text-2xl font-bold mb-1 text-yellow-500">
      <Link href={`/articles/${slug}`}> {title->React.string} </Link>
    </h3>
    <small className="text-xs"> {formattedDate->React.string} </small>
    <p className="text-md"> {description->React.string} </p>
  </div>
}

let default = make
