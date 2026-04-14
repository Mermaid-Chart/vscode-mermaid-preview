#!/usr/bin/env python3
"""DeepSeek AI 自动化任务脚本 - 可自定义任务类型"""
import os
import json
import sys
from datetime import datetime
from openai import OpenAI

# 初始化 DeepSeek 客户端 (兼容 OpenAI SDK)
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)

def deepseek_chat(prompt, system="You are a helpful assistant"):
    """调用 DeepSeek Chat API"""
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ DeepSeek API 调用失败: {e}")
        sys.exit(1)

def main():
    print("🚀 启动 DeepSeek AI 自动化任务")
    print(f"⏰ 执行时间: {datetime.now().isoformat()}")

    # ---------- 自定义任务区域 ----------
    # 示例1：代码审查总结
    prompt1 = "请用中文简要总结当前项目的核心功能，不超过100字。"
    result1 = deepseek_chat(prompt1)
    print(f"📝 项目概述: {result1}")

    # 示例2：生成技术文档片段
    prompt2 = "为「基于 DeepSeek 的自动化 CI 系统」写一段英文介绍，用于 README。"
    result2 = deepseek_chat(prompt2)

    # ---------- 保存结果 ----------
    os.makedirs("output", exist_ok=True)
    output_data = {
        "timestamp": datetime.now().isoformat(),
        "project_summary": result1,
        "readme_snippet": result2
    }
    with open("output/deepseek_results.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    with open("output/readme_snippet.txt", "w", encoding="utf-8") as f:
        f.write(result2)

    print("✅ 任务完成，结果已保存至 output/ 目录")

if __name__ == "__main__":
    main()
