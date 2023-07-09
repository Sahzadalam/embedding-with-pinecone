const { PineconeClient } = require("@pinecone-database/pinecone");

const pinecone = new PineconeClient();
pinecone
  .init({
    apiKey: "4b1afecb-c99e-4c50-921d-d4fc34a0f81b",
    projectName: "Default Project",
    environment: "us-west4-gcp",
  })
  .then(async () => {
    const createIndexRequest = {
      name: "internal-knowledgebase",
      dimension: 1536,
      metadataConfig: {
        indexed: ["content", "content_tokens"],
      },
    };
    await pinecone.createIndex({ createRequest: createIndexRequest });
    module.exports = pinecone;

    // await pinecone
    //   .createIndex(createIndexRequest)
    //   .then((createIndexResponse) => {
    //     console.log("Index created:", createIndexResponse);
    //     module.exports = pinecone; // Export the pinecone instance
    //   })
    //   .catch((error) => {
    //     console.error("Error creating index:", error);
    //   });
  })
  .catch((error) => {
    console.error("Error initializing Pinecone client:", error);
  });
