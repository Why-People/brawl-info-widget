// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: splotch;
const playerTag = args.widgetParameter;
// const playerTag = "GGQUUQ8R";
const appIconUrl = "https://github.com/Why-People/brawl-info-widget/blob/master/img/Title.png";
const trophyIconUrl = "https://static.wikia.nocookie.net/brawlstars/images/c/cd/Trophy.png/revision/latest/scale-to-width-down/100?cb=20200304181812";
const appBGUrl = "https://github.com/Why-People/brawl-info-widget/blob/master/img/Widget_BG.jpeg";

// Create Widget
let mainWidget = await createWidget();

if(config.runsFromHomeScreen){
    // Script run inside the home screen
    Script.setWidget(mainWidget);
} else if(config.runsInApp) {
  
}

Script.setWidget(mainWidget);

// End Script 
Script.complete();

// Create the Widget
async function createWidget(){
    const appIcon = await loadAppImg(appIconUrl);
    const trophyIcon = await loadAppImg(trophyIconUrl);
    const appBG = await loadAppImg(appBGUrl);

    let widget = new ListWidget();

    widget.backgroundImage = appBG;

    let appIconElement = widget.addImage(appIcon);
    appIconElement.imageSize = new Size(80, 80);
    appIconElement.centerAlignImage();

    let trophyStack = widget.addStack();

    let trophyIconElement = trophyStack.addImage(trophyIcon);
    trophyIconElement.imageSize = new Size(70, 70);
    trophyIconElement.centerAlignImage();
    trophyStack.addSpacer(22);

    let trophyCountElement = trophyStack.addText(await getPlayerTrophies(playerTag));
    trophyCountElement.textColor = Color.white();
    trophyCountElement.minimumScaleFactor = 3;
    trophyCountElement.shadowColor = Color.black();
    trophyCountElement.shadowOffset = new Point(-2, 2);
    trophyCountElement.shadowRadius = 9;
    trophyCountElement.font = Font.boldRoundedSystemFont(60);
    trophyCountElement.centerAlignText();
    trophyStack.addSpacer(8);

    return widget;
}

// Get Player Trophies from the Brawl Stars API
async function getPlayerTrophies(playerID) {
    const url = "http://10.0.0.59:8080/api/v1/player/" + playerTag;
    let req = new Request(url);
    let obj = await req.loadJSON();
    console.log(obj);
    return obj.trophies.toString();
}

// Get Image from url  
async function loadAppImg(url) {
    let req = new Request(url);
    return req.loadImage();
}