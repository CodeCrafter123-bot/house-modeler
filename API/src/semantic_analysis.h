#pragma once

#include "ast.h"
#include <string>
#include <vector>

namespace SemanticAnalyzer {
	struct Rect {
		int minX, minY, maxX, maxY;
	};

	struct Segment {
		int x1, y1, x2, y2;
	};

	bool validateHouse(HouseNode* house, std::string& errorOut);
	bool validateFloor(FloorNode* floor, int index, HouseNode* house, std::string& errorOut);
	bool validateRoom(RoomNode* room, std::string& errorOut);

	Rect toRect(const PositionNode& p);
	bool overlap(const Rect& a, const Rect& b);
	Rect getFloorBoundary(FloorNode* floor);
}