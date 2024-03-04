import express from "express";

const app = express();

app.get("/", async (req, res) => {
	res.json({ message: "success" });
});

app.listen(3000, () => {
	console.log("Listening on port 3000...");
});
