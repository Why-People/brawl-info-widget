// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: splotch;
const SCALE_FACTOR = 0.5

module.exports.runScript = async (widgetParameter) => {
  let playerTag = widgetParameter;
  // const playerTag = "GGQUUQ8R";
  const appIconUrl = "https://i.imgur.com/xbawmfe.png";
  const appBGUrl = "https://i.imgur.com/TGoHbXq.jpg";

  if(playerTag === null) {
    playerTag = "GQUUQ8R";
  }

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
  const appIcon = await loadAppImg("https://i.imgur.com/xbawmfe.png");
  console.log(appIcon.size);
  const appBG = await loadAppImg("https://i.imgur.com/TGoHbXq.jpg");
  const data = await getPlayerData(playerTag);
  
  let widget = new ListWidget();
  
  widget.backgroundImage = appBG;

  let titleStack = widget.addStack();
  
  // let appIconElement = titleStack.addImage(appIcon);
  // appIconElement.imageSize = new Size(100, 100);
  // appIconElement.minimumScaleFactor = 10;
  // appIconElement.imageSize = new Size(appIcon.size.width / 6, appIcon.size.height / 6);
  // appIconElement.leftAlignImage();
  widget.addSpacer(2);

  // trophyStack.layoutVertically();
  // trophyStack.addSpacer(2);

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
  
  // let highestTrophies = trophyStack.addText("🏆 " + data.highestTrophies);
  // highestTrophies.textColor = Color.white();
  // highestTrophies.font = Font.mediumRoundedSystemFont(30);
  // highestTrophies.minimumScaleFactor = scaleF;
  // highestTrophies.rightAlignText();
  // widget.addSpacer(2);

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

  for(const key of Object.keys(ranksToDisplay)) {
    if(ranksToDisplay[key]) {
      await createProgressStack(key, data, rankColor[key], widget);
      widget.addSpacer(2);
    }
  }

  // let rankText1 = brawlerTitleStack1.addText(data.brawlerRanks.rank35s + "/" + data.brawlers.length + " Rank 35");
  // rankText1.textColor = Color.white();
  // rankText1.font = Font.mediumRoundedSystemFont(15);
  // rankText1.minimumScaleFactor = SCALE_FACTOR;
  // rankText1.leftAlignText();

  // let contentText1 = brawlerContentStack1.addImage(await createProgressBar(data.brawlerRanks.rank35s, data.brawlers.length, new Color("8404b3")));

  // let brawlerTitleStack2 = widget.addStack();
  // let brawlerContentStack2 = widget.addStack();

  // widget.addSpacer(2);
  
  // let rankText2 = brawlerTitleStack2.addText(data.brawlerRanks.rank30s + "/" + data.brawlers.length + " Rank 30");
  // rankText2.textColor = Color.white();
  // rankText2.font = Font.mediumRoundedSystemFont(15);
  // rankText2.minimumScaleFactor = SCALE_FACTOR;
  // rankText2.leftAlignText();

  // let contentText2 = brawlerContentStack2.addImage(await createProgressBar(data.brawlerRanks.rank30s, data.brawlers.length, new Color("f01818")));

  // widget.addSpacer(2);

  // let brawlerTitleStack3 = widget.addStack();
  // let brawlerContentStack3 = widget.addStack();
  
  // let rankText3 = brawlerTitleStack3.addText(data.brawlerRanks.rank25s + "/" + data.brawlers.length + " Rank 25");
  // rankText3.textColor = Color.white();
  // rankText3.font = Font.mediumRoundedSystemFont(15);
  // rankText3.minimumScaleFactor = SCALE_FACTOR;
  // rankText3.leftAlignText();

  // let contentText3 = brawlerContentStack3.addImage(await createProgressBar(data.brawlerRanks.rank25s, data.brawlers.length, new Color("00ff8c")));

  // widget.addSpacer(2);

  // let brawlerTitleStack4 = widget.addStack();
  // let brawlerContentStack4 = widget.addStack();
  
  // let rankText4 = brawlerTitleStack4.addText(data.brawlerRanks.rank20s + "/" + data.brawlers.length + " Rank 20");
  // rankText4.textColor = Color.white();
  // rankText4.font = Font.mediumRoundedSystemFont(15);
  // rankText4.minimumScaleFactor = SCALE_FACTOR;
  // rankText4.leftAlignText();

  // let contentText4 = brawlerContentStack4.addImage(await createProgressBar(data.brawlerRanks.rank20s, data.brawlers.length, new Color("e004bc")));

  widget.addSpacer(2);
  
  return widget;
}

async function createProgressStack(rank, data, color, widget) {
  let brawlerTitleStack = widget.addStack();
  let brawlerContentStack = widget.addStack();

  const rankObj = {
    35: data.brawlerRanks.rank35s,
    30: data.brawlerRanks.rank30s,
    25: data.brawlerRanks.rank25s,
    20: data.brawlerRanks.rank20s
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
  const h = 5;
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

// Choose what rank progress bars to display to the user
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
// Get Player Trophies from the Brawl Stars API
async function getPlayerData(playerID) {
  const url = "http://10.0.0.59:8060/brawl-info-player-service/api/v1/player/" + playerID;
  let req = new Request(url);
  let obj = await req.loadJSON();
  console.log(obj);
  return obj;
}
// Get Image from url  
async function loadAppImg(url) {
  let req = new Request(url);
  console.log(req.loadJSON());
  return req.loadImage();
}

// module.exports = runScript;
