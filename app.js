import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

const SUPABASE_URL = "https://vcwrifspzrbbotrvauks.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjd3JpZnNwenJiYm90cnZhdWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjYwMTYsImV4cCI6MjA4NTgwMjAxNn0.NyoVJ6vRLQb40_vcagSU7xSo5Q34bcE-hhXxwzOb12o";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
});

const videoForm = document.querySelector("#videoForm");
const videoList = document.querySelector("#videoList");
const videoTitle = document.querySelector("#videoTitle");
const videoUrl = document.querySelector("#videoUrl");
const videoDescription = document.querySelector("#videoDescription");
const player = document.querySelector("#player");
const selectedTitle = document.querySelector("#selectedTitle");
const selectedDescription = document.querySelector("#selectedDescription");
const publishedAt = document.querySelector("#publishedAt");
const viewCount = document.querySelector("#viewCount");
const likeButton = document.querySelector("#likeButton");
const likeCount = document.querySelector("#likeCount");
const commentList = document.querySelector("#commentList");
const commentForm = document.querySelector("#commentForm");
const commentAuthor = document.querySelector("#commentAuthor");
const commentBody = document.querySelector("#commentBody");
const commentSubmit = document.querySelector("#commentSubmit");
const connectionStatus = document.querySelector("#connectionStatus");

let selectedVideo = null;
let videos = [];

const formatDate = (value) => new Date(value).toLocaleString();

const extractYouTubeId = (url) => {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/i);
  if (shortMatch) return shortMatch[1];
  const watchMatch = url.match(/[?&]v=([\w-]+)/i);
  if (watchMatch) return watchMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (embedMatch) return embedMatch[1];
  return null;
};

const renderVideos = () => {
  if (!videos.length) {
    videoList.textContent = "No videos yet. Be the first to publish!";
    return;
  }

  videoList.innerHTML = "";
  videos.forEach((video) => {
    const card = document.createElement("div");
    card.className = "video-card" + (selectedVideo?.id === video.id ? " active" : "");
    card.innerHTML = `
      <h3>${video.title}</h3>
      <p>${video.description || "No description"}</p>
      <p>Views: ${video.views} · Likes: ${video.likes}</p>
    `;
    card.addEventListener("click", () => selectVideo(video.id));
    videoList.appendChild(card);
  });
};

const renderComments = (comments) => {
  if (!selectedVideo) {
    commentList.textContent = "Pick a video to see comments.";
    return;
  }

  if (!comments.length) {
    commentList.textContent = "No comments yet. Start the conversation!";
    return;
  }

  commentList.innerHTML = "";
  comments.forEach((comment) => {
    const item = document.createElement("div");
    item.className = "comment";
    item.innerHTML = `
      <strong>${comment.author}</strong>
      <span>${comment.body}</span>
      <div class="meta">${formatDate(comment.created_at)}</div>
    `;
    commentList.appendChild(item);
  });
};

const updateSelectedVideoUI = () => {
  if (!selectedVideo) {
    selectedTitle.textContent = "Select a video";
    selectedDescription.textContent = "";
    publishedAt.textContent = "--";
    viewCount.textContent = "0";
    likeCount.textContent = "0";
    likeButton.disabled = true;
    commentSubmit.disabled = true;
    player.innerHTML = '<div class="player-placeholder">Choose a video to start watching in realtime.</div>';
    return;
  }

  selectedTitle.textContent = selectedVideo.title;
  selectedDescription.textContent = selectedVideo.description || "";
  publishedAt.textContent = formatDate(selectedVideo.created_at);
  viewCount.textContent = selectedVideo.views;
  likeCount.textContent = selectedVideo.likes;
  likeButton.disabled = false;
  commentSubmit.disabled = false;

  const videoId = extractYouTubeId(selectedVideo.youtube_url);
  if (!videoId) {
    player.innerHTML = '<div class="player-placeholder">Invalid YouTube URL.</div>';
    return;
  }

  player.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
};

const loadVideos = async () => {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    videoList.textContent = "Unable to load videos. Check Supabase configuration.";
    console.error(error);
    return;
  }

  videos = data;
  renderVideos();
};

const loadComments = async (videoId) => {
  if (!videoId) return;
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) {
    commentList.textContent = "Unable to load comments.";
    console.error(error);
    return;
  }

  renderComments(data);
};

const selectVideo = async (videoId) => {
  selectedVideo = videos.find((video) => video.id === videoId) || null;
  updateSelectedVideoUI();
  await loadComments(videoId);
  await incrementField(videoId, "views");
};

const incrementField = async (videoId, field) => {
  const current = videos.find((video) => video.id === videoId);
  if (!current) return;

  const { data, error } = await supabase
    .from("videos")
    .update({ [field]: current[field] + 1 })
    .eq("id", videoId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  videos = videos.map((video) => (video.id === data.id ? data : video));
  if (selectedVideo?.id === data.id) {
    selectedVideo = data;
    updateSelectedVideoUI();
  }
  renderVideos();
};

videoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = videoTitle.value.trim();
  const url = videoUrl.value.trim();
  const description = videoDescription.value.trim();

  if (!title || !url) return;

  const { error } = await supabase.from("videos").insert({
    title,
    youtube_url: url,
    description,
  });

  if (error) {
    alert("Unable to create video. Check Supabase configuration.");
    console.error(error);
    return;
  }

  videoForm.reset();
});

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedVideo) return;

  const author = commentAuthor.value.trim();
  const body = commentBody.value.trim();

  if (!author || !body) return;

  const { error } = await supabase.from("comments").insert({
    video_id: selectedVideo.id,
    author,
    body,
  });

  if (error) {
    alert("Unable to send comment.");
    console.error(error);
    return;
  }

  commentForm.reset();
});

likeButton.addEventListener("click", async () => {
  if (!selectedVideo) return;
  await incrementField(selectedVideo.id, "likes");
});

const subscribeToRealtime = () => {
  const videoChannel = supabase.channel("realtime:videos");
  videoChannel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "videos" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          videos = [payload.new, ...videos];
        } else if (payload.eventType === "UPDATE") {
          videos = videos.map((video) => (video.id === payload.new.id ? payload.new : video));
          if (selectedVideo?.id === payload.new.id) {
            selectedVideo = payload.new;
            updateSelectedVideoUI();
          }
        } else if (payload.eventType === "DELETE") {
          videos = videos.filter((video) => video.id !== payload.old.id);
        }
        renderVideos();
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        connectionStatus.textContent = "Realtime connected";
      }
    });

  const commentChannel = supabase.channel("realtime:comments");
  commentChannel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments" },
      (payload) => {
        if (!selectedVideo || payload.new?.video_id !== selectedVideo.id) return;
        loadComments(selectedVideo.id);
      }
    )
    .subscribe();
};

const init = async () => {
  if (SUPABASE_URL.includes("YOUR_") || SUPABASE_ANON_KEY.includes("YOUR_")) {
    videoList.textContent = "Configure your Supabase URL and anon key in app.js to get started.";
    connectionStatus.textContent = "Missing Supabase config";
    return;
  }
  await loadVideos();
  subscribeToRealtime();
};

init();

commentSubmit.disabled = true;
commentForm.addEventListener("input", () => {
  commentSubmit.disabled = !selectedVideo;
});
