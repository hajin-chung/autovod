export async function fetchJSON(url: string, init?: RequestInit) {
  console.log(`< ${url}`);
  const response = await fetch(url, init);
  const json = await response.json();
  console.log(`> ${JSON.stringify(json)}`);
  return json;
}

export const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
};

export const videoTitle = (login: string) => {
  const date = new Date();
  const title = `${date.getFullYear()} ${date.getMonth()} ${date.getDate()} ${login}`;
  return title;
};

export const writeLog = (str: string) => {
  const timestamp = new Date().toISOString();
  Deno.writeTextFile(".log", `${timestamp} ${str}\n`, { append: true });
};
