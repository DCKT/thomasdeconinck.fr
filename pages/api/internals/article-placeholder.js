import { SiteClient } from "datocms-client";

const { NEXT_ADMIN_LOGIN, NEXT_ADMIN_PASSWORD, NEXT_ADMIN_DATOCMS_API_TOKEN } =
  process.env;

const datoClient = new SiteClient(NEXT_ADMIN_DATOCMS_API_TOKEN);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { entity, previous_entity, event_type } = req.body;

    const previousTitleEn = previous_entity?.attributes.title.en;
    const previousTitleFr = previous_entity?.attributes.title.fr;

    const { en: titleEn, fr: titleFr } = entity.attributes.title;

    let enUpload = null;
    let frUpload = null;

    if (
      previousTitleEn !== titleEn ||
      !entity.attributes.social_placeholder.en
    ) {
      enUpload = await createImageUpload({
        title: titleEn,
        uploadId: entity.attributes.social_placeholder.fr?.upload_id,
        host: req.headers.host,
      });
    }

    if (
      previousTitleFr !== titleFr ||
      !entity.attributes.social_placeholder.fr
    ) {
      frUpload = await createImageUpload({
        title: titleFr,
        uploadId: entity.attributes.social_placeholder.fr?.upload_id,
        host: req.headers.host,
      });
    }

    if (frUpload || enUpload) {
      console.log(`⏳  Update entity `);
      const item = await datoClient.items.update(entity.id, {
        socialPlaceholder: {
          fr: frUpload
            ? {
                upload_id: frUpload.id,
              }
            : entity.attributes.social_placeholder.fr,
          en: enUpload
            ? {
                upload_id: enUpload.id,
              }
            : entity.attributes.social_placeholder.en,
        },
      });

      console.log(`✅  Entity update done`);
    }

    res.end();
  } else {
    res.status(405).end();
  }
}

async function createImageUpload({ title, uploadId, previousValue, host }) {
  console.log(`⏳  Create upload path`);
  const uploadPath = await datoClient.createUploadPath(
    `https://${process.env.NEXT_ADMIN_LOGIN}:${
      process.env.NEXT_ADMIN_PASSWORD
    }@${host}/api/internals/canvas-image-builder?text=${encodeURIComponent(
      title
    )}`
  );

  let upload = null;
  const basename = title.replaceAll(" ", "-");

  /*
   * If an uploadId is given, it must be an update
   **/
  if (uploadId) {
    console.log(`⏳  Update upload`);
    upload = await datoClient.uploads.update(uploadId, {
      path: uploadPath,
      basename,
    });
  } else {
    console.log(`⏳  Create upload`);
    upload = await datoClient.uploads.create({
      path: uploadPath,
      basename,
    });
  }

  return upload;
}
