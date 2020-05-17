var socket = io();

var settingsButton = document.getElementById("settingsButton");
var settingsOff = true;
var settingsDiv = document.getElementById("settings");
settingsButton.onclick = function() {
    if(settingsOff) {
        settingsOff = false;
        settingsDiv.style.display = "block";
    } else {
        settingsOff = true;
        settingsDiv.style.display = "none";
    }
};





var settings = {
    skin: false,
    mass: false
    // chatbox: false
};
function initSettings() {
    var boxes = document.querySelectorAll("input[type='checkbox']");
    boxes.forEach(function(box) {
        var value = box.checked;
        settings[box.name] = value;
    });

    /*if(settings.chatbox) {
        chatArea.style.display = "block";
    } else {
        chatArea.style.display = "none";
    }*/
};






var playButton = document.getElementById("playButton");
var nickInput = document.getElementById("nickInput");
// var chatArea = document.getElementById("chatArea");

var menuHidden = true;

var overlay = document.getElementById("overlay");
var gamemodes = document.getElementById("gamemodes");
playButton.onclick = function() {
    initSettings();
    menuHidden = true;

    var selectedMode = gamemodes.options[gamemodes.selectedIndex].value;

    var d = [ selectedMode, nickInput.value ];
    overlay.style.display = "none";
    socket.emit("join game", d);
};





var canvas = document.getElementById("gameCanvas");

var width = innerWidth;
var height = innerHeight;
canvas.height = height;
canvas.width = width;




var ctx = canvas.getContext("2d");
ctx.imageSmoothingQuality = "high";

var data = [ width, height ];
socket.emit("width and height", data);

/*var chatBox = document.getElementById("chatBox");
var msgInput = document.getElementById("msgInput");
msgInput.onkeydown = function(e) {
    var key = e.keyCode;
    var msg = this.value.trim();
    if(key == 13 && msg != "" && settings.chatbox) {
        socket.emit("msg", msg);
        this.value = "";
    }
};

socket.on("msg", function(arr) {
    chatBox.innerHTML += `
    <li class="${ arr[0] }">
        <span class="nick">${ arr[1] }</span> ${ arr[2] }
    </li>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});*/





var pressed = false;
var joined = false;

function toggleMenu() {
    if(!joined) {
        return;
    }

    initSettings();
    if(menuHidden) {
        menuHidden = false;
        overlay.style.display = "block";
    } else {
        menuHidden = true;
        overlay.style.display = "none";
    }
};
window.addEventListener("keydown", function(e) {
    var key = e.keyCode;

    /*var target = e.target;
    if(target == msgInput) {
        if(key == 13) {
            msgInput.blur();
        }
        return;
    }
    if(key == 13) {
        msgInput.focus();
        return;
    }*/

    if(key == 27) {
        toggleMenu();
    }

    /*if(!pressed) {
        pressed = true;
    } else {
        return;
    }*/

    socket.emit("input keydown", key);
});
window.addEventListener("keyup", function(e) {
    var key = e.keyCode;
    pressed = false;
    socket.emit("input keyup", key);
});

window.addEventListener("mousemove", function(e) {
    var data = [ e.clientX, e.clientY ];
    socket.emit("input mouse", data);
});







function drawNode(node) {
    var r = node.size;

    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.closePath();

    /*ctx.strokeStyle = `hsl(${ node.hue }, 100%, 50%)`
    ctx.lineWidth = r * 0.05;
    ctx.stroke();*/

    if(node.isAgitated) {
        var n = 100;
        ctx.beginPath();
        for(var i = 0; i < n; i++) {
            var e = r * 0.03;
            var extra = i % 2 == 0 ? e : -e;
            var a = i / n * Math.PI * 2;
            ctx.lineTo(
                Math.cos(a) * (r + extra), 
                Math.sin(a) * (r + extra)
            );
        };
        ctx.closePath();

        ctx.fillStyle = `hsl(94, 100%, 60%)`;
        ctx.fill();
        // ctx.stroke();
    } else {
        ctx.fillStyle = `hsl(${ node.hue }, 100%, 60%)`;
        ctx.fill();
    }



    /*if(node.isAgitated) {
        ctx.fillStyle = "rgba(0, 32, 56, 0.6)";
    }
    ctx.fill();
    if(node.isAgitated) {
        ctx.strokeStyle = "#00b1de";
        ctx.lineWidth = 15;
        ctx.stroke();
    }*/
    
    ctx.restore();

    if(node.nick && settings.skin) {
        drawSkin(node);
    }

    if(newZoom < 0.4 && r < 70) {
        return;
    }

    ctx.save();
    ctx.translate(node.x, node.y);

    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    var size = node.size;
    var fontsize = size * 0.43;
    do {
        fontsize--;
        ctx.font = fontsize + "px Arial";
    } while(ctx.measureText(node.nick).width > size * 1.86)

    /*ctx.strokeStyle = "black";
    ctx.lineWidth = size * 0.04;
    ctx.strokeText(node.nick, 0, 0);*/
    ctx.fillText(node.nick, 0, 0);
    

    if(settings.mass && node.nodeType == 0) {
        ctx.font = fontsize * 0.6 + "px Arial";
        ctx.lineWidth = size * 0.023;
        /*ctx.strokeText(
            Math.floor(node.size * node.size / 100), 
            0, fontsize);*/
        ctx.fillText(
            Math.floor(node.size * node.size / 100), 
            0, fontsize);
    }

    ctx.restore();
};

var skinArr = skins.split("\n");
function drawSkin(node) {
    if(skinArr.indexOf(node.nick.toUpperCase()) == -1) {
        return;
    }

    var r = node.size;
    var skin = new Image();
    skin.src = "http://agarioskins.com/img/skin/" + node.nick + ".png";

    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(skin, -r, -r, r * 2, r * 2);
    ctx.restore();
};








function addBlob(arr) {
    var blob = {
        sendId: arr.id,
        x: arr.x,
        y: arr.y,
        nick: arr.nick,
        size: arr.size,
        hue: arr.hue,
        isAgitated: arr.isAgitated,
        nodeType: arr.nodeType,

        newX: arr.x,
        newY: arr.y,
        newSize: arr.size
    };
    blobs.push(blob);
};


var blobs = [];
socket.on("init blobs", function(data) {
    blobs = [];
    data.forEach(function(arr) {
        addBlob(arr);
    });
});
socket.on("add blobs", function(data) {
    data.forEach(function(arr) {
        addBlob(arr);
    });
});
socket.on("remove blobs", function(data) {
    data.forEach(function(id) {
        var index = blobs.findIndex(function(a) {
            return a.sendId == id;
        });
        blobs.splice(index, 1);
    })
});

var previousPack = [];
socket.on("move blobs", function(data) {
    previousPack.forEach(function(arr) {
        var blob = blobs.find(function(a) {
            return a.sendId == arr.id;
        });
        if(blob) {
            blob.newX = arr.x;
            blob.newY = arr.y;
            blob.newSize = arr.size;
        }
    });

    previousPack = data;
});










var translateX = 5000;
var translateY = 5000;
var zoom = 1;

var newTranslateX = 5000;
var newTranslateY = 5000;
var newZoom = 1;

socket.on("center and zoom", function(arr) {
    newTranslateX = arr[0];
    newTranslateY = arr[1];
    newZoom = arr[2];
});


socket.on("dead", function() {
    joined = false;
    overlay.style.display = "block";
});
socket.on("joined", function() {
    joined = true;
    blobs = [];
    overlay.style.display = "none";
});






/*var eUI = document.getElementById("eject");
var sUI = document.getElementById("split");
function mobileUI() {   
    eUI.style.display = "block";
    sUI.style.display = "block";

    var c = document.getElementsByClassName("container");
    for(var i = 0; i < c.length; i++) {
        var cc = c[i];
        cc.style.display = "none";
    };

    document.getElementById("main").style.display = "block";
    document.getElementById("mainContainer").style.width = "300px";
    document.getElementById("mainContainer").style.margin = "10px auto";

    eUI.onclick = function() {
        var w = 87;
        socket.emit("input keydown", w);
    };
    sUI.onclick = function() {
        var space = 32;
        socket.emit("input keydown", space);
    };
};

if(width < 800) {
    mobileUI();
}*/







var leaders = [];
socket.on("leaders", function(data) {
    leaders = data;
});






function gridPattern() {
    var c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    c.ctx = c.getContext("2d");
    c.ctx.fillStyle = "#000";
    c.ctx.globalAlpha = 0.1;
    c.ctx.fillRect(0, c.width/2, c.width, 5);
    c.ctx.fillRect(c.width/2, 0, 5, c.width);
    return ctx.createPattern(c, "repeat");
}; 

function lerp(start, end) {
    if(Math.hypot(start - end) < 0) {
        return end;
    } else {
        //return start + (end - start) * 0.2 * (delta/(1000/60))/50;
        return start + (end - start) * 0.2;
    }
};


var last = Date.now();
var delta = 0;
var fps = 0;

/*window.addEventListener("wheel", function(event) {
    if(event.deltaY === 100) {
        newZoom -= 0.2;
    } else {
        newZoom += 0.2;
    }
})*/

/*setInterval(function() {
    stats.innerHTML = "FPS " + fps;;
}, 1000);

var l = document.getElementById("leaders");
var f = document.getElementById("stats");*/

function draw() {
    //l.innerHTML = "";
    //leaders.forEach(function(name) {
    //    l.innerHTML += "<div>" + name + "</div>";
    //});

    var now = Date.now();
    delta = now - last;
    last = now;

    fps = Math.round(1000/delta);


    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    translateX = lerp(translateX, newTranslateX);
    translateY = lerp(translateY, newTranslateY);
    zoom = lerp(zoom, newZoom);

    ctx.translate(-translateX, -translateY);
    ctx.scale(zoom, zoom); 

   /* ctx.fillStyle = gridPattern();
    ctx.fillRect(
        (translateX + width / 2) / zoom - 2500, 
        (translateY + height / 2) / zoom - 2500,
        5000, 5000);*/

    /*ctx.strokeStyle = "#00b1de";
    ctx.lineWidth = 35;
    ctx.strokeRect(0, 0, 10000, 10000);*/



    blobs = blobs.sort(function(a, b) {
        return a.size - b.size;
    });

    for(var i = 0; i < blobs.length; i++) {
        var node = blobs[i];
        node.x = lerp(node.x, node.newX);
        node.y = lerp(node.y, node.newY);
        node.size = lerp(node.size, node.newSize);
        
        drawNode(node);
    };

    ctx.restore();


    var w = 160;
    var p = 10;

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(width - w - p, p, w, 255);

    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";

    var tp = 20;

    ctx.font = "24px Arial";
    ctx.fillText("Leaderboard", width - w/2 - p, tp);


    ctx.font = "17px Arial";
    for(var i = 0; i < leaders.length; i++)  {
        var l = leaders[i];
        ctx.fillText(i + 1 + ". " + l, width - w/2 - p, 50 + i * tp);
    };
        
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";


    requestAnimationFrame(draw);
};

draw();
