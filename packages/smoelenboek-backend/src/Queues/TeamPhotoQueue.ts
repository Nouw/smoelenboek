import Queue from "bull";
import puppeteer from "puppeteer";
import { Database } from "../Database";
import { Gender, Team } from "smoelenboek-types";
import path from "path";
import logger from "../Utilities/Logger";
import https from "https";
import fs from "fs";
import Oracle from "../Utilities/Oracle";
import { Readable } from "stream";
import * as os from "oci-objectstorage";
import Mail from "../Utilities/Mail";

const TeamPhotoQueue = new Queue("team photo queue");

TeamPhotoQueue.process(async (_job, done: any) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const teams = await Database.manager.find(Team);

  let i = 0;
  let error = false;

  for (const team of teams) {
    const gender = team.gender === Gender.Male ? "herenteams" : "damesteams";

    const name = team.name.split(" ");
    const sub = `${name[0].toLowerCase()}-${name[1]}`;
    const url = `https://www.usvprotos.nl/teams/${gender}/${sub}`;

    await page.goto(url);

    try {
      const html = await page.$eval(
        "#team-photo",
        (element) => element.innerHTML,
      );
      const attributes = html.split(" ");

      let src = "";

      for (const attribute of attributes) {
        if (attribute.substring(0, 3) == "src") {
          src = attribute;
        }
      }
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const image = src.split('"')[1];

      const dir = path.join(__dirname, "../../public/team");

      if (!fs.existsSync(dir)) {
        fs.mkdir(dir, (err) => {
          if (err) {
            logger.error(err);
          }
        });
      }

      const filepath = path.join(
        dir,
        `/${fileName}.jpg`,
      );

      await download(image, filepath);

      const client = new Oracle().client();
      const file = await fs.promises.readFile(filepath);
      const stream = new Readable();
      stream.push(file);
      stream.push(null);

      const putObjectReq: os.requests.PutObjectRequest = {
        namespaceName: Oracle.namespaceName,
        bucketName: Oracle.bucketName,
        objectName: `team/${fileName}.jpg`,
        putObjectBody: stream,
        contentLength: stream.readableLength,
      };

      await client.putObject(putObjectReq);

      team.image = `team/${fileName}.jpg`;

      i++;
      logger.info("Team Photo Sync | Progress: " + Math.floor(i / teams.length * 100) + "%");
    } catch (e) {
      logger.error(e);
      error = true;
      continue;
    }
  }

  if (!error) {
    await Database.manager.save(teams);
    const mail = new Mail(
      "[Smoelenboek] Synchronisatie Team Foto's Compleet",
      process.env.MAIL_SEND_TO,
    );
    mail.addGreeting("Beste Secretaris");
    mail.addIntro("Het synchoniseren van de teamfoto's is afgerond.");

    await mail.send();
  }

  done();
});

function download(url: string, path: string) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);
    https.get(url, (response) => {
      response.pipe(file);

      file.on("error", (error) => {
        fs.unlink(path, () => {});
        reject(error);
      });

      file.on("close", () => {
        resolve(null);
      });
    });
  });
}

export default TeamPhotoQueue;
