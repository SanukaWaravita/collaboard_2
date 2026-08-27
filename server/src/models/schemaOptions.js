export function createSchemaOptions({
  collection,
  timestamps = false,
  hiddenFields = [],
}) {
  return {
    collection,
    timestamps,
    versionKey: false,

    toJSON: {
      virtuals: true,

      transform(_document, returnedObject) {
        returnedObject.id =
          returnedObject._id;

        delete returnedObject._id;

        hiddenFields.forEach((field) => {
          delete returnedObject[field];
        });

        return returnedObject;
      },
    },
  };
}