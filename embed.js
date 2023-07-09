const { encode } = require("gpt-3-encoder");
const fs = require("fs");
const CHUNK_LIMIT = 200;const openAiHelper = require("./openAi");

const CHUNK_MINIMAL = 100;
require("dotenv").config();
// const supabaseHelper = require("./supabase");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { default: axios } = require("axios");

const pinecone = new PineconeClient();

const chunkArticle = (article, type) => {
  let articleTextChunks = [];
  const chunkSize = CHUNK_LIMIT;
  let startIndex = 0;
  if (type) {
    articleTextChunks = article.split(",");
  } else {
    while (startIndex < article.length) {
      let endIndex = startIndex + chunkSize;
      if (endIndex >= article.length) {
        endIndex = article.length;
      } else {
        const lastDotIndex = article.lastIndexOf(",", endIndex);
        if (lastDotIndex !== -1) {
          endIndex = lastDotIndex + 2; // Include the dot and space
        }
      }

      const chunkText = article.substring(startIndex, endIndex).trim();
      articleTextChunks.push(chunkText);

      startIndex = endIndex;
    }
  }

  const articleChunks = articleTextChunks.map((text) => {
    return {
      content: text,
      content_length: text.length,
      content_tokens: encode(text).length,
      embedding: [],
    };
  });

  return articleChunks;
};

const embed = async (text, type) => {
  let chunkedArticles;
  if (text) {
    chunkedArticles = await chunkArticle(text, type);
  } else {
    const article = await fs.readFileSync("training_data.csv", {
      encoding: "utf-8",
    });
    chunkedArticles = await chunkArticle(article);
  }
  const embeddings = [];
  await pinecone.init({
    apiKey: "4b1afecb-c99e-4c50-921d-d4fc34a0f81b",
    projectName: "Default Project",
    environment: "us-west4-gcp",
  });

  for (let i = 0; i < chunkedArticles.length; i++) {
    const embedding = await openAiHelper.createEmbedding(
      chunkedArticles[i].content
    );

    embeddings.push({
      id: "vec1",
      values: embedding,
      metadata: {
        content: chunkedArticles[i].content,
        content_tokens: chunkedArticles[i].content_tokens,
      },
    });
    const url =
      "https://internal-knowledgebase-53f549d.svc.us-west4-gcp.pinecone.io/vectors/upsert";
    const apiKey = "4b1afecb-c99e-4c50-921d-d4fc34a0f81b";
    const data = {
      vectors: {
        id: i.toString(),
        values: embedding,
        metadata: {
          content: chunkedArticles[i].content,
          content_tokens: chunkedArticles[i].content_tokens,
        },
      },
      namespace: "test",
    };

    await axios
      .post(url, data, {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
        },
      })
      .then((response) => {
        console.log("Response:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    setTimeout(() => {}, 1500);
  }

  // const upsertResponse = await index.upsert(
  //   upsertRequest,
  //   "internal-knowledgebase"
  // );
  // console.log("Embeddings inserted:", upsertResponse);
};
module.exports = embed;
