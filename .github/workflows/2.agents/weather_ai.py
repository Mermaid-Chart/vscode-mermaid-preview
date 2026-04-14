#!/usr/bin/env python3
"""WeatherAI - 雨天/风力触发器，输出是否启动派单"""
import os
import random
import json

def fetch_weather(city="Taipei"):
    # 模拟实时天气数据，实际可接入 OpenWeatherMap 或 CWB API
    rain = random.uniform(0, 30)      # mm/h
    wind = random.uniform(0, 20)      # m/s
    return {"rain_mmh": rain, "wind_ms": wind, "city": city}

def main():
    weather = fetch_weather()
    print(f"🌧️ 实时天气 ({weather['city']}): 雨量 {weather['rain_mmh']:.1f} mm/h, 风速 {weather['wind_ms']:.1f} m/s")

    # 触发条件：雨量 > 5mm/h 或 风速 > 10m/s（可根据业务调整）
    should_dispatch = weather['rain_mmh'] > 5 or weather['wind_ms'] > 10

    # 输出 GitHub Actions 可读取的环境变量
    with open(os.environ.get('GITHUB_OUTPUT', 'weather_output.txt'), 'a') as f:
        f.write(f"DISPATCH={'true' if should_dispatch else 'false'}\n")

    # 同时保存详细数据供后续 Agent 使用
    with open("weather_data.json", "w") as f:
        json.dump(weather, f)

    print(f"🚦 派单决策: {'启动' if should_dispatch else '待命'}")

if __name__ == "__main__":
    main()
