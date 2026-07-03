const SITE_URL = 'https://nailongti.pages.dev';

export async function shareSite(typeName?: string): Promise<'shared' | 'copied' | 'failed'> {
  const title = '奶龙TI人格测试';
  const text = typeName ? `我测出来是「${typeName}」，你也来测测` : '测测你是哪种离谱奶龙';

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: SITE_URL });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'failed';
    }
  }

  return copySiteLink();
}

export async function copySiteLink(): Promise<'copied' | 'failed'> {
  try {
    await navigator.clipboard.writeText(SITE_URL);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export async function shareImage(blob: Blob, typeName: string): Promise<'shared' | 'unsupported' | 'failed'> {
  const file = new File([blob], `NailongTI-${typeName}.png`, { type: 'image/png' });
  const canShareFile = Boolean(navigator.canShare?.({ files: [file] }));
  if (!navigator.share || !canShareFile) return 'unsupported';

  try {
    await navigator.share({
      title: '奶龙TI人格测试',
      text: `我测出来是「${typeName}」，扫码也能测`,
      files: [file],
    });
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'failed';
    return 'failed';
  }
}

export { SITE_URL };
