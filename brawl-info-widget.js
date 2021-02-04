// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: splotch;

const SCALE_FACTOR = 0.5
const APP_BG_URL = "https://i.imgur.com/TGoHbXq.jpg";
const BASE_URL = "http://10.0.0.59:8060";

// Export the Main Function
module.exports.runScript = async (widgetParameter) => {
    let playerTag = modifyTag(widgetParameter);
    
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

async function createWidget(playerTag) {
    const appBG = await loadAppImg(APP_BG_URL);
    const data = await getPlayerData(playerTag);
    
    let widget = new ListWidget();

    widget.backgroundImage = appBG;

    if(data.error) {
        return createErrorWidget(widget);
    }
    
    widget.addSpacer(2);
    addText(data.name, widget, 30);
    widget.addSpacer(2);

    let trophyStack = widget.addStack();
    addText("🏆 " + data.trophies, trophyStack, 30);
    trophyStack.addSpacer();
    widget.addSpacer(2);

    const ranksToDisplay = getSuitableRanks(data);
    const rankColor = {
        35: new Color("8404b3"),
        30: new Color("f01818"),
        25: new Color("00ff8c"),
        20: new Color("e004bc")
    }

    // Loop in a specific order to display the higher ranks first
    for(const key of [35, 30, 25, 20]) {
        if(ranksToDisplay[key]) {
            createProgressStack(key, data, rankColor[key], widget);
            widget.addSpacer(2);
        }
    }

    widget.addSpacer(2);
    
    return widget;
}

// Create an error widget if request times out and no backup is available
function createErrorWidget(widget) {
    addText("Error", widget, 60);
    widget.addSpacer(2);
    return widget;
}

function addText(text, stack, fontSize) {
    let element = stack.addText(text);
    element.textColor = Color.white();
    element.minimumScaleFactor = SCALE_FACTOR;
    element.leftAlignText();
    element.font = Font.boldRoundedSystemFont(fontSize);
}

function createProgressStack(rank, data, color, widget) {
    let brawlerTitleStack = widget.addStack();
    let brawlerContentStack = widget.addStack();

    const rankObj = {
        20: data.brawlerRanks.rank20s,
        25: data.brawlerRanks.rank25s,
        30: data.brawlerRanks.rank30s,
        35: data.brawlerRanks.rank35s
    }; 

    addText(rankObj[rank] + "/" + data.brawlers.length + " Rank " + rank, brawlerTitleStack, 15);

    let rankProgressBar = brawlerContentStack.addImage(createProgressBar(rankObj[rank], data.brawlers.length, color));
}

function createProgressBar(ranks, max, color) {
    const w = 250;
    const h = 8;
    const context = new DrawContext();
    context.size = new Size(w, h);
    context.opaque = false;
    context.respectScreenScale = true;
    context.setFillColor(new Color("ffd900"));
    
    addPath(context, w, h);
    context.setFillColor(color);
    addPath(context, w * ranks / max, h);
    
    return context.getImage();
}

function addPath(context, width, height) {
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, width, height), 3, 2);
    context.addPath(path);
    context.fillPath();
}

function getSuitableRanks(playerData) {
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

function modifyTag(playerTag) {
    return playerTag === null ? 
    (playerTag.startsWith("#") ? 
      playerTag.substring(1).toUpperCase() : 
      playerTag.toUpperCase()) 
    : "";
}

function getBackup(playerTag) {
    let fileM = FileManager.local();
    const iCloud = fileM.isFileStoredIniCloud(module.filename);
    fileM = iCloud ? FileManager.iCloud() : fileM;

    const path = fileM.joinPath(fileM.documentsDirectory(), playerTag + ".json");

    if(!fileM.fileExists(path)) {
        return {
          error: "Request Failed and No Backup found..."
        };
    } else {
        return JSON.parse(fileM.readString(path));
    }
}

function writeBackup(obj, playerTag) {
    let fileM = FileManager.local();
    const iCloud = fileM.isFileStoredIniCloud(module.filename);
    fileM = iCloud ? FileManager.iCloud() : fileM;

    const path = fileM.joinPath(fileM.documentsDirectory(), playerTag + ".json");
    fileM.writeString(path, JSON.stringify(obj));
}

async function getPlayerData(playerTag) {
    const url = BASE_URL + "/brawl-info-player-service/api/v1/player/" + playerTag;
    let req = new Request(url);
    req.timeoutInterval = 8;
    let obj = undefined;

    try {
        obj = await req.loadJSON();
        writeBackup(obj, playerTag);
    } catch(err) {
        obj = getBackup(playerTag);
    }

    console.log(obj);
    return obj;
}

async function loadAppImg(url) {
    let req = new Request(url);
    return req.loadImage();
}
