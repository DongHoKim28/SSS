import yt_dlp
from pydub import AudioSegment
import io
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import translate_v2 as translate
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse

# Google Cloud 인증 키 설정
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
    "/root/Downloads/movie-ticket-sjle-3eb584fd34ec.json"
)

# 전역 변수로 변환된 자막 텍스트를 저장
transcript_text = ""


class SubtitleRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        print(f"GET request received: {self.path}")

        if self.path.startswith("/get_subtitle"):
            try:
                print("확장 프로그램이 실행되었습니다.")
                self.send_response(200)
                self.send_header("Content-type", "text/plain; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()

                global transcript_text

                if transcript_text:
                    parsed_path = urllib.parse.urlparse(self.path)
                    query_params = urllib.parse.parse_qs(parsed_path.query)
                    target_language = query_params.get("lang", ["ko"])[0]

                    translated_text = translate_text(
                        transcript_text, target_language=target_language
                    )
                    self.wfile.write(translated_text.encode("utf-8"))
                else:
                    self.wfile.write("No subtitles available".encode("utf-8"))
            except Exception as e:
                print(f"Error in GET request: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
            print("GET request not matched any known path")

    def do_POST(self):
        print(f"POST request received: {self.path}")

        if self.path == "/process_url":
            try:
                content_length = int(self.headers["Content-Length"])
                post_data = self.rfile.read(content_length)
                post_data = urllib.parse.parse_qs(post_data.decode("utf-8"))
                youtube_url = post_data.get("url", [None])[0]

                if youtube_url:
                    global transcript_text
                    transcript_text = process_youtube_url(youtube_url)
                    self.send_response(200)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(b"Processing complete")
                else:
                    self.send_response(400)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(b"Invalid URL")
            except Exception as e:
                print(f"Error in POST request: {e}")
                self.send_response(500)
                self.end_headers()


def process_youtube_url(youtube_url):
    print(f"Processing YouTube URL: {youtube_url}")

    try:
        audio_file = download_audio_from_youtube(youtube_url, "audio.wav")

        if audio_file is None:
            return "Failed to download audio."

        print("Converting to mono...")
        mono_audio_file = convert_to_mono(audio_file)

        print("Transcribing audio to English text...")
        english_text = transcribe_audio(mono_audio_file)
        print("English Text:", english_text)

        return english_text
    except Exception as e:
        print(f"Error processing YouTube URL: {e}")
        return "Error processing YouTube URL."


def download_audio_from_youtube(youtube_url, output_path="audio.wav"):
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        if not os.path.exists(output_path):
            raise FileNotFoundError(f"{output_path} not found.")
        print(f"Downloaded audio to {output_path}")
        return output_path
    except Exception as e:
        print(f"An error occurred during audio download: {e}")
        return None


def convert_to_mono(audio_path):
    try:
        sound = AudioSegment.from_wav(audio_path)
        sound = sound.set_channels(1)
        mono_path = audio_path.replace(".wav", "_mono.wav")
        sound.export(mono_path, format="wav")
        print(f"Converted audio to mono: {mono_path}")
        return mono_path
    except Exception as e:
        print(f"Error during audio conversion to mono: {e}")
        return None


def transcribe_audio(audio_path):
    client = speech.SpeechClient()

    try:
        with io.open(audio_path, "rb") as audio_file:
            content = audio_file.read()

        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=48000,
            language_code="en-US",
        )

        response = client.recognize(config=config, audio=audio)

        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "

        print(f"Transcribed audio to text: {transcript}")
        return transcript
    except Exception as e:
        print(f"Speech-to-Text API call failed: {e}")
        return ""


def translate_text(text, target_language="ko"):
    translate_client = translate.Client()
    try:
        result = translate_client.translate(text, target_language=target_language)
        translated_text = result["translatedText"]
    except Exception as e:
        print(f"Translation API call failed: {e}")
        translated_text = ""

    print(f"Translated text to {target_language}: {translated_text}")
    return translated_text


def run_http_server():
    try:
        server_address = ("0.0.0.0", 8081)
        httpd = HTTPServer(server_address, SubtitleRequestHandler)
        print("HTTP Server Running...")
        httpd.serve_forever()
    except Exception as e:
        print(f"Failed to start the server: {e}")


if __name__ == "__main__":
    run_http_server()
