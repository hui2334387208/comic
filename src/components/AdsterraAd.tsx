"use client";

import { useEffect, useRef, useState } from 'react';

interface AdsterraAdProps {
  adKey?: string;
  height?: number;
  width?: number;
  className?: string;
}

const AdsterraAd = ({ 
  adKey = 'eb6a1848bb32595691c8210ebce1af9b',
  height = 90,
  width = 728,
  className = ""
}: AdsterraAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (adContainerRef.current && !adContainerRef.current.firstChild) {
      // 先设置配置
      (window as any).atOptions = {
        'key': adKey,
        'format': 'iframe',
        'height': height,
        'width': width,
        'params': {}
      };

      // 再加载脚本
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
      script.async = true;
      
      script.onload = () => {
        // 检查广告是否真的加载了
        setTimeout(() => {
          if (adContainerRef.current && adContainerRef.current.children.length > 0) {
            setAdLoaded(true);
          } else {
            setAdError(true);
          }
        }, 1000);
      };
      
      script.onerror = () => {
        setAdError(true);
      };
      
      adContainerRef.current.appendChild(script);
    }
  }, [adKey, height, width]);

  // 如果广告加载失败或没有加载，不渲染任何内容
  if (adError) {
    return null;
  }

  // 如果广告还没加载完成，也不渲染容器
  if (!adLoaded) {
    return <div ref={adContainerRef} style={{ display: 'none' }} />;
  }

  return <div ref={adContainerRef} className={className} />;
};

export default AdsterraAd;
