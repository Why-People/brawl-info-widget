// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: splotch;

const SCALE_FACTOR = 0.5
const APP_ICON_URL = "https://i.imgur.com/xbawmfe.png";
const APP_BG_URL = "https://i.imgur.com/TGoHbXq.jpg";
const BASE_URL = "http://10.0.0.59:8060";

// Export the Main Function
module.exports.runScript = async (widgetParameter) => {
  let playerTag = widgetParameter;

  if(playerTag === null) playerTag = "GQUUQ8R";
  else playerTag = await modifyTag(playerTag);
  
  let mainWidget = await createWidget(playerTag);

  if(config.runsFromHomeScreen){
    Script.setWidget(mainWidget);
  } else if(config.runsInApp) {
    // Show a small Widget Preview
    mainWidget.presentSmall();
  }

  Script.setWidget(mainWidget);

  Script.complete();
}

// Create the widget
async function createWidget(playerTag) {
  const appIcon = await loadAppImg(APP_ICON_URL);
  const appBG = await loadAppImg(APP_BG_URL);
  const data = await getPlayerData(playerTag);
  
  let widget = new ListWidget();

  widget.backgroundImage = appBG;

  if(data.error) {
    return await createErrorWidget(widget);
  }
  
  widget.addSpacer(2);
  await addText(data.name, widget);
  widget.addSpacer(2);

  let trophyStack = widget.addStack();
  await addText("🏆 " + data.trophies, trophyStack);
  widget.addSpacer(2);

  const ranksToDisplay = await getSuitableRanks(data);
  const rankColor = {
    35: new Color("8404b3"),
    30: new Color("f01818"),
    25: new Color("00ff8c"),
    20: new Color("e004bc")
  }

  // Loop in a specific order so we can display the higher ranks first
  for(const key of [35, 30, 25, 20]) {
    if(ranksToDisplay[key]) {
      await createProgressStack(key, data, rankColor[key], widget);
      widget.addSpacer(2);
    }
  }

  widget.addSpacer(2);
  
  return widget;
}

// Create an error widget if request times out and no backup is available
async function createErrorWidget(widget) {
  let name = widget.addText("Error");
  name.textColor = Color.white();
  name.font = Font.boldRoundedSystemFont(60);
  name.minimumScaleFactor = SCALE_FACTOR;
  name.centerAlignText();
  widget.addSpacer(2);

  return widget;
}

async function addText(text, stack) {
  let element = stack.addText(text);
  element.textColor = Color.white();
  element.minimumScaleFactor = SCALE_FACTOR;
  element.leftAlignText();

  if(typeof stack === WidgetStack) {
    element.font = Font.mediumRoundedSystemFont(30);
    stack.addSpacer();
  } else {
    element.font = Font.boldRoundedSystemFont(30);
  }
}

async function createProgressStack(rank, data, color, widget) {
  let brawlerTitleStack = widget.addStack();
  let brawlerContentStack = widget.addStack();

  const rankObj = {
    20: data.brawlerRanks.rank20s,
    25: data.brawlerRanks.rank25s,
    30: data.brawlerRanks.rank30s,
    35: data.brawlerRanks.rank35s
  }; 

  let rankText = brawlerTitleStack.addText(rankObj[rank] + "/" + data.brawlers.length + " Rank " + rank);
  rankText.textColor = Color.white();
  rankText.font = Font.mediumRoundedSystemFont(15);
  rankText.minimumScaleFactor = SCALE_FACTOR;
  rankText.leftAlignText();

  let rankProgressBar = brawlerContentStack.addImage(await createProgressBar(rankObj[rank], data.brawlers.length, color));
}

async function createProgressBar(ranks, max, color) {
  const w = 250;
  const h = 8;
  const context = new DrawContext();
  context.size = new Size(w, h);
  context.opaque = false;
  context.respectScreenScale = true;
  context.setFillColor(new Color("ffd900"));
  
  const path = new Path();
  path.addRoundedRect(new Rect(0, 0, w, h), 3, 2);
  context.addPath(path);
  context.fillPath();
  context.setFillColor(color);
  
  const path1 = new Path();
  path1.addRoundedRect(new Rect(0, 0, w * ranks / max, h), 3, 2);
  context.addPath(path1);
  context.fillPath();
  return context.getImage();
}

async function getSuitableRanks(playerData) {
  let displayRanks = {
    35: false,
    30: false,
    25: false,
    20: false
  };
  
  if(playerData.brawlerRanks.rank35s > 0) {
    displayRanks[35] = true;
    displayRanks[30] = true;
  } else if(playerData.brawlerRanks.rank30s > 0) {
    displayRanks[30] = true;
    displayRanks[25] = true;
  } else {
    displayRanks[25] = true;
    displayRanks[20] = true;
  }
  
  return displayRanks;
}

async function modifyTag(playerTag) {
  return playerTag.startsWith("#") ? playerTag.substring(1).toUpperCase() : playerTag.toUpperCase();
}

async function getPlayerData(playerTag) {
  const url = BASE_URL + "/brawl-info-player-service/api/v1/player/" + playerTag;
  let req = new Request(url);
  req.timeoutInterval = 8;
  let obj = undefined;

  try {
    obj = await req.loadJSON();
    await writeBackup(obj, playerTag);
  } catch(err) {
    obj = await getBackup(playerTag);
  }

  console.log(obj);
  return obj;
}

async function loadAppImg(url) {
  let req = new Request(url);
  return req.loadImage();
}

async function getBackup(playerTag) {
  let fileM = FileManager.local();
  const iCloud = fileM.isFileStoredIniCloud(module.filename);
  fileM = iCloud ? FileManager.iCloud() : fileM;

  const path = fileM.joinPath(fileM.documentsDirectory(), playerTag + ".json");

  if(!fileM.fileExists(path)) {
    return {
      error: "Request Failed and No Backup found..."
    };
  } else {
    if(iCloud) await fileM.downloadFileFromiCloud(path);
    return JSON.parse(fileM.readString(path));
  }
}

async function writeBackup(obj, playerTag) {
  let fileM = FileManager.local();
  const iCloud = fileM.isFileStoredIniCloud(module.filename);
  fileM = iCloud ? FileManager.iCloud() : fileM;

  const path = fileM.joinPath(fileM.documentsDirectory(), playerTag + ".json");
  fileM.writeString(path, JSON.stringify(obj));
}
