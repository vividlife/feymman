// 音频转换工具：将 webm/opus 转换为 PCM 格式

export async function convertWebmToPcm(webmBlob: Blob): Promise<Uint8Array> {
  // 创建音频上下文
  const audioContext = new AudioContext({ sampleRate: 16000 })

  // 解码 webm 为 AudioBuffer
  const arrayBuffer = await webmBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // 获取音频数据
  const channelData = audioBuffer.getChannelData(0)

  // 转换为 16-bit PCM
  const pcmData = new Int16Array(channelData.length)
  for (let i = 0; i < channelData.length; i++) {
    // 将 float [-1, 1] 转换为 int16
    const sample = Math.max(-1, Math.min(1, channelData[i]))
    pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
  }

  // 转换为 Uint8Array
  const uint8Array = new Uint8Array(pcmData.buffer)

  await audioContext.close()

  return uint8Array
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  return btoa(binary)
}

export async function webmBlobToPcmBase64(webmBlob: Blob): Promise<string> {
  const pcmData = await convertWebmToPcm(webmBlob)
  return uint8ArrayToBase64(pcmData)
}
