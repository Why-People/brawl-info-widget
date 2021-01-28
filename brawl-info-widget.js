// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: splotch;

const SCALE_FACTOR = 0.5
const APP_ICON_URL = "https://i.imgur.com/xbawmfe.png";
const APP_BG_URL = "https://i.imgur.com/TGoHbXq.jpg";

// Export the Main Function
module.exports.runScript = async (widgetParameter) => {
  let playerTag = widgetParameter;

  if(playerTag === null) playerTag = "GQUUQ8R";
  else playerTag = await modifyTag(playerTag);
  
  // Create Widget
  let mainWidget = await createWidget(playerTag);

  if(config.runsFromHomeScreen){
    // Script run inside the home screen
    Script.setWidget(mainWidget);
  } else if(config.runsInApp) {
    // Allows for Widget Preview
    mainWidget.presentSmall();
  }

  // Set the main widget
  Script.setWidget(mainWidget);

  // End Script 
  Script.complete();
}

// Create the widget
async function createWidget(playerTag) {
  const appIcon = await loadAppImg(APP_ICON_URL);
  const appBG = await loadAppImg(APP_BG_URL);
  const data = await getPlayerData(playerTag);
  
  let widget = new ListWidget();
  
  widget.backgroundImage = appBG;
  
  widget.addSpacer(2);

  let name = widget.addText(data.name);
  name.textColor = Color.white();
  name.font = Font.boldRoundedSystemFont(30);
  name.minimumScaleFactor = SCALE_FACTOR;
  name.leftAlignText();
  widget.addSpacer(2);

  let trophyStack = widget.addStack();
  
  let trophyCountElement = trophyStack.addText("🏆 " + data.trophies);
  trophyCountElement.textColor = Color.white();
  trophyCountElement.font = Font.mediumRoundedSystemFont(30);
  trophyCountElement.minimumScaleFactor = SCALE_FACTOR;
  trophyCountElement.leftAlignText();
  trophyStack.addSpacer();
  widget.addSpacer(2);

  let brawlerTitleStack1 = widget.addStack();
  let brawlerContentStack1 = widget.addStack();

  widget.addSpacer(2);

  const ranksToDisplay = await getSuitableRanks(data);
  const rankColor = {
    35: new Color("8404b3"),
    30: new Color("f01818"),
    25: new Color("00ff8c"),
    20: new Color("e004bc")
  }

  // We want to loop in a specific order due so we can display the higher ranks first
  for(const key of [35, 30, 25, 20]) {
    if(ranksToDisplay[key]) {
      await createProgressStack(key, data, rankColor[key], widget);
      widget.addSpacer(2);
    }
  }

  widget.addSpacer(2);
  
  return widget;
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

// Create the progress bar for the ranks
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

// Choose what rank progress bars to display to the user (Top 2)
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

// Make the Player Tag request compatible
async function modifyTag(playerTag) {
  return playerTag.startsWith("#") ? playerTag.substring(1).toUpperCase() : playerTag.toUpperCase();
}

// Get Player Trophies from the Brawl Stars API
async function getPlayerData(playerTag) {
  const url = "http://10.0.0.59:8060/brawl-info-player-service/api/v1/player/" + playerTag;
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

// Get Image from url  
async function loadAppImg(url) {
  let req = new Request(url);
  return req.loadImage();
}

// Get backup file if request times out
async function getBackup(playerTag) {
  let fileM = FileManager.local();
  const iCloud = fileM.isFileStoredIniCloud(module.filename);
  fileM = iCloud ? FileManager.iCloud() : fileM;

  const path = fileM.joinPath(fileM.documentsDirectory(), playerTag + ".txt");

  if(!fileM.fileExists(path)) {
    return {
      errorMsg: "Request Failed and No Backup found..."
    };
  } else {
    if(iCloud) await fileM.downloadFileFromiCloud(path);
    return JSON.parse(fileM.readString(path));
  }
}

// Write the contents of the response to a backup file in case of Request Timeout for future requests
async function writeBackup(obj, playerTag) {
  let fileM = FileManager.local();
  const iCloud = fileM.isFileStoredIniCloud(module.filename);
  fileM = iCloud ? FileManager.iCloud() : fileM;

  const path = fileM.joinPath(fileM.documentsDirectory(), playerTag + ".txt");
  fileM.writeString(path, JSON.stringify(obj));
}
