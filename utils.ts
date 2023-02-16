export async function fetchJSON(url: string, init?: RequestInit) {
  console.log(`< ${url}`);
  const response = await fetch(url, init);
  const json = await response.json();
  console.log(`> ${JSON.stringify(json)}`);
  return json;
}

export const videoTitle = (login: string) => {
  const date = new Date();
  const title = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${login}`;
  return title;
};

export const writeLog = (str: string) => {
  const timestamp = new Date().toISOString();
  Deno.writeTextFileSync(".log", `${timestamp} ${str}\n`, { append: true });
};

export const initLog = async () => {
  await Deno.create("./.log");
  writeLog("initialize log file");
};

export const cred = (secret: string | undefined) => {
  if (secret) return `${secret.slice(0, 10)}...`;
  else return "undefined";
};
