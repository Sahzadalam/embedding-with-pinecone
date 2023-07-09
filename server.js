const { default: axios } = require("axios");
const openAiHelper = require("./openAi");
const express = require("express");
const { PineconeClient } = require("@pinecone-database/pinecone");
const embed = require("./embed");
const pinecone = new PineconeClient();
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

// Parse URL-encoded bodies for this app
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const embedding = await openAiHelper.createEmbedding(q);
    await pinecone.init({
      apiKey: "4b1afecb-c99e-4c50-921d-d4fc34a0f81b",
      projectName: "Default Project",
      environment: "us-west4-gcp",
    });
    const url =
      "https://internal-knowledgebase-53f549d.svc.us-west4-gcp.pinecone.io/query";
    const headers = {
      "Content-Type": "application/json",
      "Api-Key": "4b1afecb-c99e-4c50-921d-d4fc34a0f81b",
    };
    const data = {
      vector: embedding,
      top_k: 5,
      includeMetadata: true,
      includeValues: true,
      namespace: "test",
    };

    await axios
      .post(url, data, { headers })
      .then((response) => {
        res.status(200).send({ data: response.data });
      })
      .catch((error) => {
        // Handle the error
        console.error(error);
        res.status(404).send({ message: error });
      });
  } catch (e) {
    res.status(404).send({ message: e });
  }
});
app.post("/embed", async (req, res) => {
  try {
    const { type } = req.query;
    if (type == "userInput") {
      await embed(req.body.text,type);
    } else {
      await embed();
    }
    res.status(200).send({ message: `embedding completed` });
  } catch (e) {
    res.status(404).send({ message: `${e}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
