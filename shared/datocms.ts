import { GraphQLClient, Variables } from "graphql-request";
import { RequestDocument } from "graphql-request";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";

export function request<TDocument = any>({
  query,
  variables,
}: {
  query: RequestDocument | TypedDocumentNode<TDocument, Variables>;
  variables?: Variables;
}) {
  const endpoint = `https://graphql.datocms.com/`;

  const client = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${process.env.NEXT_DATOCMS_API_TOKEN}`,
      "X-Exclude-Invalid": "true",

      ...(variables?.enableDraft
        ? {
            "X-Include-Drafts": "true",
          }
        : {}),
    },
  });
  return client.request<TDocument, Variables>(query, {
    ...variables,
    locale: variables?.locale || "fr",
  });
}
