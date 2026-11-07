#include "semantic_analysis.h"
#include <algorithm>
#include <cmath>
#include <set>
#include <limits>

namespace SemanticAnalyzer {
	// ================= HELPER =================

	Rect toRect(const PositionNode& p) {
		return {
			std::min(p.a.x, p.b.x),
			std::min(p.a.y, p.b.y),
			std::max(p.a.x, p.b.x),
			std::max(p.a.y, p.b.y)
		};
	}

	bool overlap(const Rect& a, const Rect& b) {
		// touching edges is allowed
		return !(a.maxX <= b.minX || a.minX >= b.maxX ||
			a.maxY <= b.minY || a.minY >= b.maxY);
	}

	// ================= MAIN =================

	bool validateHouse(HouseNode* house, std::string& errorOut) {
		if (!house) return true;

		// 1. Floors count
		if (house->floors.size() < 1 || house->floors.size() > 10) {
			errorOut = "House must have between 1 and 10 floors.";
			return false;
		}

		for (size_t i = 0; i < house->floors.size(); ++i) {
			if (!validateFloor(house->floors[i].get(), (int)i, house, errorOut)) {
				return false;
			}
		}

		return true;
	}

	bool validateFloor(FloorNode* floor, int index, HouseNode* house, std::string& errorOut) {
		// 2. Height constraint
		if (floor->height <= 2 || floor->height >= 6) {
			errorOut = "Floor " + std::to_string(index + 1) + ": height must be between 2 and 6.";
			return false;
		}

		// 3. At least one room
		if (floor->rooms.empty()) {
			errorOut = "Floor " + std::to_string(index + 1) + " must contain at least one room.";
			return false;
		}

		// 4. Stair rule (all floors except last must have stair)
		if (index < (int)house->floors.size() - 1 && !floor->stair) {
			errorOut = "Floor " + std::to_string(index + 1) + " must contain a stair.";
			return false;
		}

		// Validate rooms + overlaps
		for (size_t i = 0; i < floor->rooms.size(); ++i) {
			if (!validateRoom(floor->rooms[i].get(), errorOut)) return false;

			Rect r1 = toRect(floor->rooms[i]->position);

			for (size_t j = i + 1; j < floor->rooms.size(); ++j) {
				Rect r2 = toRect(floor->rooms[j]->position);

				if (overlap(r1, r2)) {
					errorOut = "Floor " + std::to_string(index + 1) + ": rooms overlap.";
					return false;
				}
			}
		}

		// Compute floor boundary
		Rect boundary = getFloorBoundary(floor);

		// 5. Upper floor inside lower floor
		if (index > 0) {
			Rect lower = getFloorBoundary(house->floors[index - 1].get());

			if (boundary.minX < lower.minX || boundary.maxX > lower.maxX ||
				boundary.minY < lower.minY || boundary.maxY > lower.maxY) {
				errorOut = "Floor " + std::to_string(index + 1) + " exceeds lower floor boundary.";
				return false;
			}
		}

		// 6. Stair checks
		if (floor->stair) {
			Rect stairRect = toRect(floor->stair->position);

			// 1. Inside floor boundary (same as before)
			if (stairRect.minX < boundary.minX || stairRect.maxX > boundary.maxX ||
				stairRect.minY < boundary.minY || stairRect.maxY > boundary.maxY) {
				errorOut = "Floor " + std::to_string(index + 1) + ": stair is outside boundary.";
				return false;
			}

			// 2. Wall intersection check
			for (auto& roomPtr : floor->rooms) {
				Rect roomRect = toRect(roomPtr->position);

				// Check if the stair is partially inside and partially outside the room
				bool startsInside = (stairRect.minX >= roomRect.minX && stairRect.maxX <= roomRect.maxX &&
					stairRect.minY >= roomRect.minY && stairRect.maxY <= roomRect.maxY);

				bool completelyOutside = (stairRect.maxX <= roomRect.minX || stairRect.minX >= roomRect.maxX ||
					stairRect.maxY <= roomRect.minY || stairRect.minY >= roomRect.maxY);

				// If it's not completely outside AND not completely inside, it MUST be crossing a wall
				if (!startsInside && !completelyOutside) {
					errorOut = "Floor " + std::to_string(index + 1) + ": stair intersects a wall.";
					return false;
				}

				// Optional: If you want to forbid stairs from being EXACTLY on the wall line:
				if (startsInside) {
					bool onWall = (stairRect.minX == roomRect.minX || stairRect.maxX == roomRect.maxX ||
						stairRect.minY == roomRect.minY || stairRect.maxY == roomRect.maxY);
					// If your project rules say "not even touching the wall line", uncomment below:
					// if (onWall) { errorOut = "..."; return false; }
				}
			}
		}
		return true;
	}

	bool validateRoom(RoomNode* room, std::string& errorOut) {
		Rect r = toRect(room->position);

		int width = r.maxX - r.minX;
		int height = r.maxY - r.minY;

		// Rectangle validity
		if (width == 0 || height == 0) {
			errorOut = "Room must form a valid rectangle.";
			return false;
		}

		// Min width
		if (width < 1) {
			errorOut = "Room width must be at least 1.";
			return false;
		}

		// Min area
		if (width * height < 2) {
			errorOut = "Room area must be at least 2.";
			return false;
		}

		// At least one door
		if (room->doors.empty()) {
			errorOut = "Room must have at least one door.";
			return false;
		}

		// Unique walls for openings
		std::set<std::string> usedWalls;

		for (auto& d : room->doors) {
			if (!usedWalls.insert(d->wall->value).second) {
				errorOut = "Multiple openings on the same wall: " + d->wall->value;
				return false;
			}
		}

		for (auto& w : room->windows) {
			if (!usedWalls.insert(w->wall->value).second) {
				errorOut = "Multiple openings on the same wall: " + w->wall->value;
				return false;
			}
		}

		return true;
	}

	Rect getFloorBoundary(FloorNode* floor) {
		Rect b;
		b.minX = std::numeric_limits<int>::max();
		b.minY = std::numeric_limits<int>::max();
		b.maxX = std::numeric_limits<int>::min();
		b.maxY = std::numeric_limits<int>::min();

		for (auto& r : floor->rooms) {
			Rect rr = toRect(r->position);

			b.minX = std::min(b.minX, rr.minX);
			b.minY = std::min(b.minY, rr.minY);
			b.maxX = std::max(b.maxX, rr.maxX);
			b.maxY = std::max(b.maxY, rr.maxY);
		}

		return b;
	}
}