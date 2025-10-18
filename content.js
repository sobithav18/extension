console.log("✅ content.js loaded");

const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get("v");
let currentVideoId = videoId;

let fetchedCommentsData = []; // Global array to store fetched comment data

console.log("📹 Extracted Video ID:", videoId);

if (videoId) {
  console.log(`📡 Sending request to Flask backend for videoId=${videoId}`);
  fetch(`http://127.0.0.1:5001/comments?videoId=${videoId}`)
    .then(response => {
      console.log("📨 Response received from Flask");
      return response.json();
    })
    .then(data => {
      console.log("📦 Parsed response JSON:", data);
      if (data.comments) {
        fetchedCommentsData = data.comments;
        blurComments(fetchedCommentsData); // Run initially
      } else {
        console.error("❌ Error fetching comments:", data.error);
      }
    })
    .catch(error => console.error("⚠️ Fetch error:", error));
} else {
  console.warn("⚠️ No videoId found in URL.");
}

// ✅ Function to blur negative comments
function blurComments(commentsData) {
  console.log("🎯 Blurring comments with negative sentiment...");

  const commentElements = document.querySelectorAll('#content-text');

  commentElements.forEach(el => {
    const commentText = el.innerText.trim().toLowerCase().replace(/\s+/g, " ");

    const matchedComment = commentsData.find(commentData => {
      const backendText = commentData.comment.trim().toLowerCase().replace(/\s+/g, " ");
      return commentText.includes(backendText) || backendText.includes(commentText);
    });

    if (matchedComment && matchedComment.sentiment === "Negative") {
      el.style.filter = 'blur(5px)';
      el.style.transition = 'filter 0.3s ease';
      // Optional highlight for debugging
      // el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      console.log("🧠 Blurred negative comment:", matchedComment.comment);
    }
  });
}

// 🔁 Detect when video ID changes (SPA behavior on YouTube)
setInterval(() => {
  const newVideoId = new URLSearchParams(window.location.search).get("v");
  if (newVideoId !== currentVideoId) {
    console.log("🔄 Video ID changed! Reloading content script...");
    location.reload(); // Reload on new video
  }
}, 2000);

// 👀 Observe DOM for dynamically added comments
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) { // ELEMENT_NODE
        if (node.matches('#content-text') || node.querySelector('#content-text')) {
          blurComments(fetchedCommentsData);
        }
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 🔧 Optional: manual filter via popup message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 Received message from popup:", request);
  if (request.action === "filterComments") {
    const comments = document.querySelectorAll(".comment");
    comments.forEach(comment => {
      if (comment.textContent.includes("bad") || comment.textContent.includes("hate")) {
        comment.style.filter = "blur(5px)";
      }
    });
    console.log("🔍 Filtered comments based on keywords");
  }
});
