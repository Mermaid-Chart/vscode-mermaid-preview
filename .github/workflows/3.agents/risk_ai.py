"""RiskAI - 基于天气与地理信息评估派单风险等级"""
import json

def main():
    with open("weather_data.json", "r") as f:
        weather = json.load(f)

    risk_score = 0
    if weather['rain_mmh'] > 10:
        risk_score += 40
    if weather['wind_ms'] > 15:
        risk_score += 30

    risk_level = "LOW" if risk_score < 30 else "MEDIUM" if risk_score < 70 else "HIGH"
    print(f"⚠️ 风险评分: {risk_score} ({risk_level})")

    with open("risk_assessment.json", "w") as f:
        json.dump({"score": risk_score, "level": risk_level}, f)

if __name__ == "__main__":
    main()
