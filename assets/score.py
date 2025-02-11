import numpy as np
import pandas as pd

#Define constants
Z_MULTIPLIER = 0.1
BASE_FAME = 1000

# Define the ranges
k_values = np.arange(1.0, 2.1, 0.1)  # k from 1 to 2 in steps of 0.1
z_values = np.arange(1, 13, 1)       # z from 1 to 12
X_values = np.arange(3000, 15000, 1000) # X from 3000 to 1000 in steps of 1000

# Initialize storage for results
data = []

def calculate_score(win: bool, fame: int, staking_lives: int) -> float:
    base_win_points = 100
    base_lose_points = 10
    
    # Calculate Fame Multiplier
    fame_multiplier = max(1.0, 1 + ((fame - 3000) // 1000) / 10)
    
    # Calculate Staking Multiplier
    staking_multiplier = 1.0 + (staking_lives - 1) * 0.1
    
    # Apply both multipliers
    final_multiplier = fame_multiplier * staking_multiplier
    
    # Determine base points
    base_points = base_win_points if win else base_lose_points
    
    # Final score calculation
    return base_points * final_multiplier


# Compute Ygained and Ylost for each combination
for k in k_values:
    for z in z_values:
        for X in X_values:
            k_value = (k + (Z_MULTIPLIER * (z-1)))
            denominator = np.floor(((X / BASE_FAME) + 1) / k_value)
            if denominator == 0:
                Ygained = 0
            else:
                Ygained = (BASE_FAME / denominator) * z
            Ylost = BASE_FAME * z
            
            score_win = calculate_score(True, X, z)
            score_loss = calculate_score(False, X, z)
            
            data.append([round(k, 1), round(k_value, 1), z, X, int(Ygained), Ylost, score_win, score_loss])

# Convert to DataFrame
df = pd.DataFrame(data, columns=["k", "k_total", "z", "Xcurrent", "Ygained", "Ylost", "Score Won", "Score Loss"])

# Display first few rows
df.head(1000)

