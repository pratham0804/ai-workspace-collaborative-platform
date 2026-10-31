import  app  from "./app.js";
import { env } from "./config/env.js";

// const PORT = 5000;
// const PORT = process.env.PORT;  we cannot do this everywhere

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});