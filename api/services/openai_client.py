import base64
import json
import logging
import re
import time

from openai import OpenAI

from api.config import COLOR_TO_RESOURCE, OPENAI_API_KEY

logger = logging.getLogger(__name__)

PROMPT = """
Parse this picture and return the background color and number.

The color can be grey, brown, yellow, beige, light green or dark green.

If there is no number on it, set it to 7 and the color should be beige.
If there is a number on it, the number cannot be 7 and the color cannot be beige.

The output format must be JSON such as:
{
    "value": 2,
    "color": "yellow"
}
"""

MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds; doubles on each retry


def _extract_json(raw):
    """Extract JSON from an OpenAI response, handling markdown fences and bare JSON."""
    # Try fenced code block first (```json ... ```)
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", raw, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())

    # Try bare JSON object
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError(f"No JSON found in response: {raw[:200]}")


class OpenAIClient:
    def __init__(self, model="gpt-4o"):
        self.client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.model = model

    def _call_api(self, messages):
        """Call the OpenAI API with retry logic for transient failures."""
        if not self.client:
            raise RuntimeError("OpenAI API key not configured")

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    temperature=0,
                    top_p=1,
                    messages=messages,
                )
                return response.choices[0].message.content
            except Exception as exc:
                last_error = exc
                if attempt < MAX_RETRIES:
                    delay = RETRY_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        "OpenAI API call failed (attempt %d/%d): %s — retrying in %ds",
                        attempt,
                        MAX_RETRIES,
                        exc,
                        delay,
                    )
                    time.sleep(delay)

        raise RuntimeError(
            f"OpenAI API failed after {MAX_RETRIES} attempts: {last_error}"
        )

    def parse_tile(self, image_path):
        """Parse a single tile image and return (resource_code, value)."""
        with open(image_path, "rb") as f:
            base64_image = base64.b64encode(f.read()).decode("utf-8")

        raw = self._call_api(
            [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ]
        )

        try:
            data = _extract_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(
                "Failed to parse OpenAI response for %s: %s\nRaw: %s",
                image_path,
                exc,
                raw[:300],
            )
            raise ValueError(f"Could not parse tile response: {exc}") from exc

        color = data.get("color", "beige")
        value = data.get("value", 0)
        resource_code = COLOR_TO_RESOURCE.get(color, "r")

        # Desert tile: value becomes 0
        if resource_code == "r":
            value = 0

        return resource_code, str(value)

    def parse_board(self, tile_paths):
        """Parse all 19 tiles and return (resources, values) lists."""
        resources = []
        values = []
        for path in tile_paths:
            resource, value = self.parse_tile(path)
            resources.append(resource)
            values.append(value)
        return resources, values
