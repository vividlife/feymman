模型 qwen3.5-omni-flash-realtime
模型介绍

Qwen3.5
实时全模态
Qwen3.5-Omni是Qwen最新一代全模态大模型，支持文本，图片，音频，音视频理解与交互。作为 Qwen3-Omni 的全面进化版本，支持60+种语言音频输入，30+语言语音输出以及可控语音对话，WebSearch和复杂FunctionCall的调用，并且具备智能语义打断的交互能力，广泛应用于文本创作、语音助手、多媒体分析等场景，提供自然流畅的多模态交互体验。

该模型版本功能等同于快照模型qwen3.5-omni-flash-realtime-2026-03-15


如何使用
1. 建立连接
Qwen-Omni-Realtime 模型通过 WebSocket 协议接入，可通过以下 Python 示例代码建立连接。也可通过DashScope SDK 建立连接。

# pip install websocket-client
import json
import websocket
import os

API_KEY=os.getenv("DASHSCOPE_API_KEY")
API_URL = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime"

headers = [
    "Authorization: Bearer " + API_KEY
]

def on_open(ws):
    print(f"Connected to server: {API_URL}")
def on_message(ws, message):
    data = json.loads(message)
    print("Received event:", json.dumps(data, indent=2))
def on_error(ws, error):
    print("Error:", error)

ws = websocket.WebSocketApp(
    API_URL,
    header=headers,
    on_open=on_open,
    on_message=on_message,
    on_error=on_error
)

ws.run_forever()


2. 配置会话
发送客户端事件session.update：

{
    // 该事件的id，由客户端生成
    "event_id": "event_ToPZqeobitzUJnt3QqtWg",
    // 事件类型，固定为session.update
    "type": "session.update",
    // 会话配置
    "session": {
        // 输出模态，支持设置为["text"]（仅输出文本）或["text","audio"]（输出文本与音频）。
        "modalities": [
            "text",
            "audio"
        ],
        // 输出音频的音色
        "voice": "Cherry",
        // 输入音频格式，当前仅支持设置为pcm。
        "input_audio_format": "pcm",
        // 输出音频格式，当前仅支持设置为pcm。
        "output_audio_format": "pcm",
        // 系统消息，用于设定模型的目标或角色。
        "instructions": "你是某五星级酒店的AI客服专员，请准确且友好地解答客户关于房型、设施、价格、预订政策的咨询。请始终以专业和乐于助人的态度回应，杜绝提供未经证实或超出酒店服务范围的信息。",
        // 是否开启语音活动检测。若需启用，需传入一个配置对象，服务端将据此自动检测语音起止。
        // 设置为null表示由客户端决定何时发起模型响应。
        "turn_detection": {
            // VAD类型，需设置为server_vad。
            "type": "server_vad",
            // VAD检测阈值。建议在嘈杂的环境中增加，在安静的环境中降低。
            "threshold": 0.5,
            // 检测语音停止的静音持续时间，超过此值后会触发模型响应
            "silence_duration_ms": 800
        }
    }
}

3. 输入音频与图片
客户端通过input_audio_buffer.append和 input_image_buffer.append 事件发送 Base64 编码的音频和图片数据到服务端缓冲区。音频输入是必需的；图片输入是可选的。

图片可以来自本地文件，或从视频流中实时采集。
启用服务端VAD时，服务端会在检测到语音结束时自动提交数据并触发响应。禁用VAD时（手动模式），客户端必须在发送完数据后，主动调用input_audio_buffer.commit事件来提交。
4. 接收模型响应
模型的响应格式取决于配置的输出模态。

仅输出文本

通过response.text.delta事件接收流式文本，response.text.done事件获取完整文本。

输出文本+音频

文本：通过response.audio_transcript.delta事件接收流式文本，response.audio_transcript.done事件获取完整文本。

音频：通过response.audio.delta事件获取 Base64 编码的流式输出音频数据。response.audio.done事件标志音频数据生成完成。

模型选型
Qwen3.5-Omni-Realtime 是千问最新推出的实时多模态模型，相比于上一代的 Qwen3-Omni-Flash-Realtime：

智能水平

模型智力大幅提升，与 Qwen3.5-Plus 智能水平相当。

联网搜索

原生支持联网搜索（WebSearch），模型可自主判断是否需要搜索来回应即时问题。详见联网搜索。

语义打断

自动识别对话意图，避免附和声和无意义背景音触发打断。

语音控制

通过语音指令控制声音大小、语速和情绪，如“语速快一些”、“声音大一些”、“用开心的语气”等。

支持的语言

支持 113 种语种和方言的语音识别，以及 36 种语种和方言的语音生成。

支持的音色

支持 55 种音色（47 种多语言 + 8 种方言），具体可查看音色列表。

模型的名称、上下文、价格、快照版本等信息请参见模型列表；并发限流条件请参考限流。


快速开始

准备运行环境

您的 Python 版本需要不低于 3.10。

首先根据您的操作系统来安装 pyaudio。

brew install portaudio && pip install pyaudio
安装完成后，通过 pip 安装 websocket 相关的依赖：

pip install websockets==15.0.1

创建客户端

在本地新建一个 python 文件，命名为omni_realtime_client.py，并将以下代码复制进文件中：
import asyncio
import websockets
import json
import base64
import time
from typing import Optional, Callable, List, Dict, Any
from enum import Enum

class TurnDetectionMode(Enum):
    SERVER_VAD = "server_vad"
    MANUAL = "manual"

class OmniRealtimeClient:

    def __init__(
            self,
            base_url,
            api_key: str,
            model: str = "",
            voice: str = "Ethan",
            instructions: str = "You are a helpful assistant.",
            turn_detection_mode: TurnDetectionMode = TurnDetectionMode.SERVER_VAD,
            on_text_delta: Optional[Callable[[str], None]] = None,
            on_audio_delta: Optional[Callable[[bytes], None]] = None,
            on_input_transcript: Optional[Callable[[str], None]] = None,
            on_output_transcript: Optional[Callable[[str], None]] = None,
            extra_event_handlers: Optional[Dict[str, Callable[[Dict[str, Any]], None]]] = None
    ):
        self.base_url = base_url
        self.api_key = api_key
        self.model = model
        self.voice = voice
        self.instructions = instructions
        self.ws = None
        self.on_text_delta = on_text_delta
        self.on_audio_delta = on_audio_delta
        self.on_input_transcript = on_input_transcript
        self.on_output_transcript = on_output_transcript
        self.turn_detection_mode = turn_detection_mode
        self.extra_event_handlers = extra_event_handlers or {}

        # 当前回复状态
        self._current_response_id = None
        self._current_item_id = None
        self._is_responding = False
        # 输入/输出转录打印状态
        self._print_input_transcript = True
        self._output_transcript_buffer = ""

    async def connect(self) -> None:
        """与 Realtime API 建立 WebSocket 连接。"""
        url = f"{self.base_url}?model={self.model}"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        self.ws = await websockets.connect(url, additional_headers=headers)

        # 会话配置
        session_config = {
            "modalities": ["text", "audio"],
            "voice": self.voice,
            "instructions": self.instructions,
            "input_audio_format": "pcm",
            "output_audio_format": "pcm",
            "input_audio_transcription": {
                "model": "gummy-realtime-v1"
            }
        }

        if self.turn_detection_mode == TurnDetectionMode.MANUAL:
            session_config['turn_detection'] = None
            await self.update_session(session_config)
        elif self.turn_detection_mode == TurnDetectionMode.SERVER_VAD:
            session_config['turn_detection'] = {
                "type": "server_vad",
                "threshold": 0.1,
                "prefix_padding_ms": 500,
                "silence_duration_ms": 900
            }
            await self.update_session(session_config)
        else:
            raise ValueError(f"Invalid turn detection mode: {self.turn_detection_mode}")

    async def send_event(self, event) -> None:
        event['event_id'] = "event_" + str(int(time.time() * 1000))
        await self.ws.send(json.dumps(event))

    async def update_session(self, config: Dict[str, Any]) -> None:
        """更新会话配置。"""
        event = {
            "type": "session.update",
            "session": config
        }
        await self.send_event(event)

    async def stream_audio(self, audio_chunk: bytes) -> None:
        """向 API 流式发送原始音频数据。"""
        # 仅支持 16bit 16kHz 单声道 PCM
        audio_b64 = base64.b64encode(audio_chunk).decode()
        append_event = {
            "type": "input_audio_buffer.append",
            "audio": audio_b64
        }
        await self.send_event(append_event)

    async def commit_audio_buffer(self) -> None:
        """提交音频缓冲区以触发处理。"""
        event = {
            "type": "input_audio_buffer.commit"
        }
        await self.send_event(event)

    async def append_image(self, image_chunk: bytes) -> None:
        """向图像缓冲区追加图像数据。
        图像数据可以来自本地文件，也可以来自实时视频流。
        注意:
            - 图像格式必须为 JPG 或 JPEG。推荐分辨率为 480P 或 720P，最高支持 1080P。
            - 单张图片大小不应超过 500KB。
            - 将图像数据编码为 Base64 后再发送。
            - 建议以 1张/秒 的频率向服务端发送图像。
            - 在发送图像数据之前，需要至少发送过一次音频数据。
        """
        image_b64 = base64.b64encode(image_chunk).decode()
        event = {
            "type": "input_image_buffer.append",
            "image": image_b64
        }
        await self.send_event(event)

    async def create_response(self) -> None:
        """向 API 请求生成回复（仅在手动模式下需要调用）。"""
        event = {
            "type": "response.create"
        }
        await self.send_event(event)

    async def cancel_response(self) -> None:
        """取消当前回复。"""
        event = {
            "type": "response.cancel"
        }
        await self.send_event(event)

    async def handle_interruption(self):
        """处理用户对当前回复的打断。"""
        if not self._is_responding:
            return
        # 1. 取消当前回复
        if self._current_response_id:
            await self.cancel_response()

        self._is_responding = False
        self._current_response_id = None
        self._current_item_id = None

    async def handle_messages(self) -> None:
        try:
            async for message in self.ws:
                event = json.loads(message)
                event_type = event.get("type")
                if event_type == "error":
                    print(" Error: ", event['error'])
                    continue
                elif event_type == "response.created":
                    self._current_response_id = event.get("response", {}).get("id")
                    self._is_responding = True
                elif event_type == "response.output_item.added":
                    self._current_item_id = event.get("item", {}).get("id")
                elif event_type == "response.done":
                    self._is_responding = False
                    self._current_response_id = None
                    self._current_item_id = None
                elif event_type == "input_audio_buffer.speech_started":
                    print("检测到语音开始")
                    if self._is_responding:
                        print("处理打断")
                        await self.handle_interruption()
                elif event_type == "input_audio_buffer.speech_stopped":
                    print("检测到语音结束")
                elif event_type == "response.text.delta":
                    if self.on_text_delta:
                        self.on_text_delta(event["delta"])
                elif event_type == "response.audio.delta":
                    if self.on_audio_delta:
                        audio_bytes = base64.b64decode(event["delta"])
                        self.on_audio_delta(audio_bytes)
                elif event_type == "conversation.item.input_audio_transcription.completed":
                    transcript = event.get("transcript", "")
                    print(f"用户: {transcript}")
                    if self.on_input_transcript:
                        await asyncio.to_thread(self.on_input_transcript, transcript)
                        self._print_input_transcript = True
                elif event_type == "response.audio_transcript.delta":
                    if self.on_output_transcript:
                        delta = event.get("delta", "")
                        if not self._print_input_transcript:
                            self._output_transcript_buffer += delta
                        else:
                            if self._output_transcript_buffer:
                                await asyncio.to_thread(self.on_output_transcript, self._output_transcript_buffer)
                                self._output_transcript_buffer = ""
                            await asyncio.to_thread(self.on_output_transcript, delta)
                elif event_type == "response.audio_transcript.done":
                    print(f"大模型: {event.get('transcript', '')}")
                    self._print_input_transcript = False
                elif event_type in self.extra_event_handlers:
                    self.extra_event_handlers[event_type](event)
        except websockets.exceptions.ConnectionClosed:
            print(" Connection closed")
        except Exception as e:
            print(" Error in message handling: ", str(e))
    async def close(self) -> None:
        """关闭 WebSocket 连接。"""
        if self.ws:
            await self.ws.close()

选择交互模式

VAD 模式（Voice Activity Detection，自动检测语音起止）

Realtime API 自动判断用户何时开始与停止说话并作出回应。

Manual 模式（按下即说，松开即发送）

客户端控制语音起止。用户说话结束后，客户端需主动发送消息至服务端。

在omni_realtime_client.py的同级目录下新建另一个 python 文件，命名为vad_mode.py，并将以下代码复制进文件中：

# -- coding: utf-8 --
import os, asyncio, pyaudio, queue, threading
from omni_realtime_client import OmniRealtimeClient, TurnDetectionMode

# 音频播放器类（处理中断）
class AudioPlayer:
    def __init__(self, pyaudio_instance, rate=24000):
        self.stream = pyaudio_instance.open(format=pyaudio.paInt16, channels=1, rate=rate, output=True)
        self.queue = queue.Queue()
        self.stop_evt = threading.Event()
        self.interrupt_evt = threading.Event()
        threading.Thread(target=self._run, daemon=True).start()

    def _run(self):
        while not self.stop_evt.is_set():
            try:
                data = self.queue.get(timeout=0.5)
                if data is None: break
                if not self.interrupt_evt.is_set(): self.stream.write(data)
                self.queue.task_done()
            except queue.Empty: continue

    def add_audio(self, data): self.queue.put(data)
    def handle_interrupt(self): self.interrupt_evt.set(); self.queue.queue.clear()
    def stop(self): self.stop_evt.set(); self.queue.put(None); self.stream.stop_stream(); self.stream.close()

# 麦克风录音并发送
async def record_and_send(client):
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=3200)
    print("开始录音，请讲话...")
    try:
        while True:
            audio_data = stream.read(3200)
            await client.stream_audio(audio_data)
            await asyncio.sleep(0.02)
    finally:
        stream.stop_stream(); stream.close(); p.terminate()

async def main():
    p = pyaudio.PyAudio()
    player = AudioPlayer(pyaudio_instance=p)

    client = OmniRealtimeClient(
        # 以下是中国内地（北京）地域 base_url，国际（新加坡）地域base_url为wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
        base_url="wss://dashscope.aliyuncs.com/api-ws/v1/realtime",
        api_key=os.environ.get("DASHSCOPE_API_KEY"),
        model="qwen3.5-omni-plus-realtime",
        voice="Cherry",
        instructions="你是小云，风趣幽默的好助手",
        turn_detection_mode=TurnDetectionMode.SERVER_VAD,
        on_text_delta=lambda t: print(f"\nAssistant: {t}", end="", flush=True),
        on_audio_delta=player.add_audio,
    )

    await client.connect()
    print("连接成功，开始实时对话...")

    # 并发运行
    await asyncio.gather(client.handle_messages(), record_and_send(client))

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n程序已退出。")


运行vad_mode.py，通过麦克风即可与 Realtime 模型实时对话，系统会检测您的音频起始位置并自动发送到服务器，无需您手动发送。



交互流程
将session.update事件的session.turn_detection 设为"server_vad"以启用 VAD 模式。此模式下，服务端自动检测语音起止并进行响应。适用于语音通话场景。

交互流程如下：

服务端检测到语音开始，发送input_audio_buffer.speech_started 事件。

客户端随时发送 input_audio_buffer.append与input_image_buffer.append 事件追加音频与图片至缓冲区。

发送 input_image_buffer.append 事件前，至少发送过一次 input_audio_buffer.append 事件。
服务端检测到语音结束，发送input_audio_buffer.speech_stopped 事件。

服务端发送input_audio_buffer.committed 事件提交音频缓冲区。

服务端发送 conversation.item.created 事件，包含从缓冲区创建的用户消息项。

生命周期

客户端事件

服务端事件

会话初始化

session.update

会话配置
session.created

会话已创建
session.updated

会话配置已更新
用户音频输入

input_audio_buffer.append

添加音频到缓冲区
input_image_buffer.append

添加图片到缓冲区
input_audio_buffer.speech_started

检测到语音开始
input_audio_buffer.speech_stopped

检测到语音结束
input_audio_buffer.committed

服务器收到提交的音频
服务器音频输出

无

response.created

服务端开始生成响应
response.output_item.added

响应时有新的输出内容
conversation.item.created

对话项被创建
response.content_part.added

新的输出内容添加到assistant message
response.audio_transcript.delta

增量生成的转录文字
response.audio.delta

模型增量生成的音频
response.audio_transcript.done

文本转录完成
response.audio.done

音频生成完成
response.content_part.done

Assistant message 的文本或音频内容流式输出完成
response.output_item.done

Assistant message 的整个输出项流式传输完成
response.done

响应完成