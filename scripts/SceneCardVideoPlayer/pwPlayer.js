// Inspired by clangmoyai's IINA player script in github !
// This script will add a "Play" button in each scene card.
// Allow you to easily play those video files.
// To use it, just copy and paste the code into Stash->Settings->Interface->Custome Javascript.
// Then refresh the browser.
// This is only version 1.0

// settings
const debug = false;
function log(str){
	if(debug)console.log(str);
}

const pwPlayer_settings = {
	"Mode": "local",
	// Path fixes for different OS
	"Windows":{
		// Not used.
		"urlScheme": "file:///",
		// double backsplashes need 4 backslashes.
		"replacePath": ["\\\\", "/"],
	},
	"Android":{
		// Not used.
		"urlScheme": "file:///",
		"replacePath": ["", ""],
	},
	"iOS":{
		// Not use
		"urlScheme": "file://",
		"replacePath": ["", ""],
	},
	"Linux":{
		// not use
		"urlScheme": "file://",
		"replacePath": ["", ""],
	},
	"MacOS":{
		// For local iina player.
		"urlScheme": "iina://weblink?url=file://",
		"replacePath": ["", ""],
	}
};

// style
const pwPlayer_style = document.createElement("style");
pwPlayer_style.innerHTML = `
    .pwPlayer_button {
        border-radius: 3.5px;
        cursor: pointer;
        padding: 2px 9px 3px 13px;
    }
    .pwPlayer_button:hover {
        background-color: rgba(138, 155, 168, .15);
    }
    .pwPlayer_button svg {
        fill: currentColor;
        width: 1em;
        vertical-align: middle;
    }
    .pwPlayer_button span {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.1em;
        color: currentColor;
        vertical-align: middle;
        margin-left: 3px;
    }
	#pwPlayer_videoDiv{
		background: black;
		position: absolute;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
		z-index: 99;
	}
}
`;

// Only need to call once.
const pwPlayer_OS = pwPlayer_getOS();
log("OS: " + pwPlayer_OS);
document.head.appendChild(pwPlayer_style);


// api
const pwPlayer_getSceneInfo = async href => {
    const regex = /\/scenes\/(\d+)\?/,
        sceneId = regex.exec(href)[1],
        graphQl = `{ findScene(id: ${sceneId}) { files { path }, paths{stream} } }`,
        response = await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: graphQl })
        });
    return response.json();
};

function pwPlayer_getOS() {
	var userAgent = window.navigator.userAgent,
	platform = window.navigator?.userAgentData?.platform,
	macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
	windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
	iosPlatforms = ['iPhone', 'iPad', 'iPod'],
	os = null;

	if (macosPlatforms.indexOf(platform) !== -1) {
	os = 'MacOS';
	} else if (iosPlatforms.indexOf(platform) !== -1) {
	os = 'iOS';
	} else if (windowsPlatforms.indexOf(platform) !== -1) {
	os = 'Windows';
	} else if (/Android/.test(userAgent)) {
	os = 'Android';
	} else if (/Linux/.test(platform)) {
	os = 'Linux';
	}

	return os;
}

// promise
const pwPlayer_waitForElm = selector => {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
};

// initial
pwPlayer_waitForElm("video").then(() => {
    pwPlayer_addButton();
});

// route
let previousUrl = "";
const observer = new MutationObserver(function (mutations) {
    if (window.location.href !== previousUrl) {
        previousUrl = window.location.href;
        pwPlayer_waitForElm("video").then(() => {
            pwPlayer_addButton();
        });
    }
});
const config = { subtree: true, childList: true };
observer.observe(document, config);

// main
const pwPlayer_addButton = () => {
    const scenes = document.querySelectorAll("div.row > div");
    for (const scene of scenes) {
        if (scene.querySelector("a.pwPlayer_button") === null) {
            const scene_url = scene.querySelector("a.scene-card-link"),
			popover = scene.querySelector("div.card-popovers"),
			button = document.createElement("a");
            button.innerHTML = `
			<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
			<path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272-176 
			101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/></svg>
			<span>Play</span>`;

            button.classList.add("pwPlayer_button");
			button.href = "javascript:;";
			button.onclick = () =>{
				pwPlayer_getSceneInfo(scene_url.href)
				.then((result) =>{
					const streamLink = result.data.findScene.paths.stream;
					const filePath = result.data.findScene.files[0].path
						.replace(pwPlayer_settings[pwPlayer_OS].replacePath[0], "");
					switch (pwPlayer_OS){
						case "Mac OS":
							// For iina player.
							if(debug)alert("you just click play in MacOS");
							if (pwPlayer_settings.Mode == "local"){
								href = pwPlayer_settings.MacOS.urlScheme +
								pwPlayer_settings.MacOS.replacePath[1] +
									encodeURIComponent(filePath);
							}else{
								href = streamLink;
							}
							playVideoInBrowser(streamLink);
							break;
						case "iOS":
							if(debug)alert("you just click play in iOS");
							playVideoInBrowser(streamLink);
							break;
						case "Android":
							if(debug)alert("you just click play in Android");
							intent = new Intent(android.content.Intent.ACTION_VIEW);
							if (pwPlayer_settings.Mode == "local"){
								uriData = Uri.parse( pwPlayer_settings.Android.urlScheme + filePath);
							}else{
								uriData = Uri.parse(streamLink);
							}
							intent.setDataAndType(uriData, "video/*");
							context.startActivity(intent);
							break;
						case "Windows":
							if(debug)alert("you just click play in Windows");
							log("streamLink:" + streamLink);
							playVideoInBrowser(streamLink);
							break;
						default:
							if(debug)alert("You just click play in an unknow OS.");

					}
				});

			};

            if (popover) popover.append(button);

            button.onmouseover = () => {
                if (button.title.length == 0) {
                    pwPlayer_getSceneInfo(scene_url.href)
                        .then((result) => {
							// console.log("result: " + JSON.stringify(result));
                            const filePath = result.data.findScene.files[0].path
                                .replace(pwPlayer_settings[pwPlayer_OS].replacePath[0], "");
                            button.title = filePath;
                        });
                }
            };
        }
    }
};

function playVideoInBrowser(streamLink){
	var pwPlayer_video_div = document.createElement("div");
	// log("video_div instance of node:" + (video_div instanceof Node));

	pwPlayer_video_div.id = "pwPlayer_videoDiv";
	var pwPlayer_video = document.createElement("video");
	pwPlayer_video.autoplay = true;
	pwPlayer_video.controls = true;
	pwPlayer_video.src = streamLink;
	pwPlayer_video.width = window.innerWidth-20;
	pwPlayer_video.height = window.innerHeight;
	pwPlayer_video_div.appendChild(pwPlayer_video);
	var pwPlayer_divNode = document.body.insertBefore(pwPlayer_video_div, document.body.firstChild);
	// log("divNode instance of node:" + (divNode instanceof Node));
	log("win w:" + window.innerWidth);
	log("win h: "+ window.innerHeight);
	window.addEventListener('resize', () => {
		pwPlayer_video.width = window.innerWidth-20;
		pwPlayer_video.height = window.innerHeight;
	});
	// save the scroll postion.
	var pwPlayer_scrollPos;
	if (typeof window.pageYOffset != 'undefined') {
		pwPlayer_scrollPos = window.pageYOffset;
	}
	else if (typeof document.compatMode != 'undefined' && document.compatMode != 'BackCompat') {
		pwPlayer_scrollPos = document.documentElement.scrollTop;
	}
	else if (typeof document.body != 'undefined') {
		pwPlayer_scrollPos = document.body.scrollTop;
	}
	log("scroll pos:" + pwPlayer_scrollPos);

	window.scrollTo(0,0);

	// track mouse y position
	var pwPlayer_mouseY = 0;
	document.onmousemove = (e) => {
		pwPlayer_mouseY = e.clientY;
	}

	pwPlayer_video.onerror = () => {
		alert("Error playing this video.");
		document.body.removeChild(pwPlayer_divNode);
		log("Error in playing, scroll pos:" + pwPlayer_scrollPos);
		window.scrollTo(0, pwPlayer_scrollPos);
	}

	pwPlayer_video.onpause = (event) => {
		var rect = event.target.getBoundingClientRect();
		var y = rect.top + rect.height - pwPlayer_mouseY;
		log("client Y:" + pwPlayer_mouseY + " y:" + y + ' rect h:' + rect.height);
		if ( Math.abs(y) < rect.height / 5 ) return;


		document.body.removeChild(pwPlayer_divNode);
		log("play ends, scroll pos:" + pwPlayer_scrollPos);
		window.scrollTo(0, pwPlayer_scrollPos);
	}
	pwPlayer_video.onended = () => {
		document.body.removeChild(pwPlayer_divNode);
		window.scrollTo(0, pwPlayer_scrollPos);
	}
}


