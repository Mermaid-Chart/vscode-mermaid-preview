#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DeepSeek AI 自动化任务执行器
用于 GitHub Actions CI / 闪电帝国项目
兼容 OpenAI SDK，使用 DeepSeek API
"""
import os
import json
import sys
from datetime import datetime
from openai import OpenAI

# ==================== 初始化 DeepSeek 客户端 ====================
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"  # DeepSeek 官方端点
)

def deepseek_chat(prompt, system="You are a helpful assistant", temperature=0.3, max_tokens=2000):
    """调用 DeepSeek Chat API，返回文本内容"""
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ DeepSeek API 调用失败: {e}")
        sys.exit(1)

# ==================== 自定义任务区 ====================
def task_generate_project_summary():
    """任务1：生成项目概述（中文）"""
    prompt = "请用中文简要总结当前项目的核心功能与架构特点，不超过150字。"
    return deepseek_chat(prompt, system="你是一位技术架构师，擅长用简洁的语言描述复杂系统。")

def task_generate_readme_snippet():
    """任务2：生成英文 README 介绍片段"""
    prompt = "Write a concise English introduction for a project named 'Lightning Empire', which is a multi-agent AI dispatch system with Kubernetes deployment and patent automation. Keep it under 100 words."
    return deepseek_chat(prompt, system="You are a technical writer.")

def task_analyze_code_quality(code_snippet=""):
    """任务3：代码质量分析（示例）"""
    if not code_snippet:
        # 可以从当前仓库读取文件内容
        try:
            with open("agents/weather_ai.py", "r", encoding="utf-8") as f:
                code_snippet = f.read()
        except:
            code_snippet = "# No code found"
    prompt = f"分析以下 Python 代码，指出潜在问题并提出改进建议（中文）：\n\n```python\n{code_snippet[:3000]}\n```"
    return deepseek_chat(prompt, system="你是一位资深 Python 代码审查专家。")

# ==================== 主函数 ====================
def main():
    print("🚀 DeepSeek AI 自动化任务启动")
    print(f"⏰ 执行时间: {datetime.now().isoformat()}")
    
    results = {}

    # 执行任务1：项目概述
    print("\n📝 任务1: 生成项目概述...")
    results["project_summary"] = task_generate_project_summary()
    print(f"   结果: {results['project_summary'][:100]}...")

    # 执行任务2：README 片段
    print("\n🌐 任务2: 生成英文 README 片段...")
    results["readme_snippet_en"] = task_generate_readme_snippet()
    print(f"   结果: {results['readme_snippet_en'][:100]}...")

    # 执行任务3：代码分析（可选）
    print("\n🔍 任务3: 分析 agents/weather_ai.py 代码质量...")
    results["code_analysis"] = task_analyze_code_quality()
    print(f"   结果: {results['code_analysis'][:100]}...")

    # ==================== 保存结果 ====================
    os.makedirs("output", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 保存 JSON
    json_path = f"output/deepseek_results_{timestamp}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "results": results
        }, f, indent=2, ensure_ascii=False)
    
    # 保存纯文本摘要
    txt_path = f"output/readme_snippet_{timestamp}.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(results["readme_snippet_en"])
    
    print(f"\n✅ 所有任务完成")
    print(f"📁 JSON 结果: {json_path}")
    print(f"📁 文本结果: {txt_path}")

if __name__ == "__main__":
    main()
