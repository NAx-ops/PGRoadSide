import streamlit as st
import pandas as pd
from google import genai
from google.genai import types

# --- PAGE SETUP ---
st.set_page_config(page_title="Maryland Winter Road Assistant", page_icon="❄️")
st.title("❄️ Winter Road Safety Assistant")
st.markdown("Ask about road conditions or specific icy patches.")

# --- DATA LOGIC (From your previous script) ---
@st.cache_data
def load_and_clean_data():
    df = pd.read_csv('rwis_map_data.csv')
    
    # --- Existing Cleaning ---
    def clean_temp(val):
        try: return float(str(val).split('F')[0])
        except: return None
        
    def clean_precip(val):
        return str(val).strip().lower() == "true"

    df['pavementTemp'] = df['pavementTemp'].apply(clean_temp)
    df['is_precipitating'] = df['precipitationType'].apply(clean_precip)

    # --- NEW: PG County Coordinate Filter ---
    # Define the bounding box for Prince George's County
    lat_min, lat_max = 38.53, 39.15
    lon_min, lon_max = -77.08, -76.66

    df = df[
        (df['lat'] >= lat_min) & (df['lat'] <= lat_max) &
        (df['lon'] >= lon_min) & (df['lon'] <= lon_max)
    ]
    
    return df

df = load_and_clean_data()

# --- TOOLS ---
def get_all_icy_roads():
    icy_df = df[(df['pavementTemp'] < 32) & (df['is_precipitating'] == True)]
    if icy_df.empty: return "No roads are currently reported as icy."
    return ", ".join(icy_df['name'].unique().tolist())

# --- GEMINI SETUP ---
# Use st.secrets for production, but for now we'll use your key
client = genai.Client(api_key="AIzaSyDIj2-1d3XanXUM4cDX7HgGiRdmXSGy4v8")

# --- CHAT INTERFACE ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# User Input
if prompt := st.chat_input("Are the roads icy?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Simple Local Logic to save Quota
    if "icy" in prompt.lower() or "roads" in prompt.lower():
        icy_list = get_all_icy_roads()
        response_text = f"Here is the current report: {icy_list} \n\nPlease drive safely!"
    else:
        # Gemini Logic
        with st.chat_message("assistant"):
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are a winter road assistant. Be brief."
                )
            )
            response_text = response.text
            st.markdown(response_text)
    
    st.session_state.messages.append({"role": "assistant", "content": response_text})
