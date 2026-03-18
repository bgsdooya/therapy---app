const SU = "https://assautgcinohojjgufjn.supabase.co";
const SK = "sb_publishable_zew7hL6PtkxDqrbN5ocUZg_cHBJ4fcw";

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => new Response('')));
});

// 백그라운드 메시지 체크 (1분마다)
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'check-messages') {
    e.waitUntil(checkMessages());
  }
});

// 메인 앱에서 환자 이름 받아서 저장
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SET_PATIENT') {
    self.patientName = e.data.name;
  }
});

async function checkMessages() {
  if (!self.patientName) return;
  try {
    const res = await fetch(
      `${SU}/rest/v1/messages?patient_name=eq.${encodeURIComponent(self.patientName)}&is_read=eq.false&order=created_at.asc&limit=1`,
      { headers: { apikey: SK, Authorization: `Bearer ${SK}` } }
    );
    const msgs = await res.json();
    if (msgs && msgs.length > 0) {
      const m = msgs[0];
      await self.registration.showNotification("🏥 양산제일병원 재활치료팀", {
        body: m.content,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: m.id,
        requireInteraction: true,
        data: { msgId: m.id }
      });
      // 읽음 처리
      await fetch(
        `${SU}/rest/v1/messages?id=eq.${m.id}`,
        {
          method: "PATCH",
          headers: { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ is_read: true })
        }
      );
    }
  } catch (e) {}
}

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length > 0) { list[0].focus(); return; }
      return clients.openWindow('/');
    })
  );
});

// 폴링 방식 (periodicsync 미지원 브라우저용) - 30초마다
setInterval(() => { checkMessages(); }, 30000);
