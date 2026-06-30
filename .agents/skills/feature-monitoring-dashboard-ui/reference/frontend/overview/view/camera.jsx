import React, { useRef, useEffect, useCallback } from 'react';

const Camera = React.memo(({ source, primaryColor, primaryContrastText }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video || !source?.link) return;

    // Cleanup trước khi khởi tạo lại
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Lazy import hls.js (nằm trong react-hls-player dependencies)
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        // Fallback: trình duyệt hỗ trợ HLS native (Safari)
        video.src = source.link;
        video.addEventListener('error', () => {
          // Retry sau 5s nếu lỗi
          retryTimeoutRef.current = setTimeout(() => initHls(), 5000);
        });
        return;
      }

      const hls = new Hls({
        // Cấu hình recovery khi stream bị lỗi
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        // Tự động retry khi mất kết nối
        manifestLoadingMaxRetry: Infinity,
        manifestLoadingRetryDelay: 2000,
        levelLoadingMaxRetry: Infinity,
        levelLoadingRetryDelay: 2000,
        fragLoadingMaxRetry: Infinity,
        fragLoadingRetryDelay: 2000,
      });

      hls.loadSource(source.link);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { });
      });

      // Xử lý lỗi — tự động recovery
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Lỗi mạng — thử recover
              console.warn(`[Camera ${source.name}] Network error, recovering...`);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // Lỗi media — thử recover
              console.warn(`[Camera ${source.name}] Media error, recovering...`);
              hls.recoverMediaError();
              break;
            default:
              // Lỗi nghiêm trọng — destroy và retry sau 5s
              console.error(`[Camera ${source.name}] Fatal error, retrying in 5s...`);
              hls.destroy();
              hlsRef.current = null;
              retryTimeoutRef.current = setTimeout(() => initHls(), 5000);
              return;
          }
        }
      });

      hlsRef.current = hls;
    });
  }, [source?.link, source?.name]);

  useEffect(() => {
    initHls();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initHls]);

  const headerStyle = {
    width: '100%',
    backgroundColor: primaryColor,
    text: primaryContrastText || 'white',
    height: '100%',
    borderRadius: 10,
  };

  const titleStyle = {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bolder',
    color: primaryContrastText || 'white',
    padding: 10,
  };

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden' }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{source.name}</h1>
      </div>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
});

export default Camera;
