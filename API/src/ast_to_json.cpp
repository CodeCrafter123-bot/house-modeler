#include "ast.h"
#include "json.hpp"

using json = nlohmann::json;

//transforms the AST into a JSON object to send through the API
json houseToJson(HouseNode* h) {
	json j = json::object();

	j["FLOORS"] = json::array();

	for (std::vector<std::unique_ptr<FloorNode>>::iterator fit = h->floors.begin();
		fit != h->floors.end();
		++fit)
	{
		FloorNode* f = fit->get();

		json floor = json::object();
		floor["HEIGHT"] = f->height;
		if (!f->color.empty()) {
			floor["COLOR"] = f->color;
		}
		floor["ROOMS"] = json::array();

		for (std::vector<std::unique_ptr<RoomNode>>::iterator rit = f->rooms.begin();
			rit != f->rooms.end();
			++rit)
		{
			RoomNode* r = rit->get();

			json room = json::object();

			room["POSITION"] = {
				{ r->position.a.x, r->position.a.y },
				{ r->position.b.x, r->position.b.y }
			};

			room["DOORS"] = json::array();
			for (std::vector<std::unique_ptr<DoorNode>>::iterator dit = r->doors.begin();
				dit != r->doors.end();
				++dit)
			{
				DoorNode* d = dit->get();

				json door = json::object();
				door["WALL"] = d->wall->value;

				room["DOORS"].push_back(door);
			}

			room["WINDOWS"] = json::array();
			for (std::vector<std::unique_ptr<WindowNode>>::iterator wit = r->windows.begin();
				wit != r->windows.end();
				++wit)
			{
				WindowNode* w = wit->get();

				json window = json::object();
				window["WALL"] = w->wall->value;

				room["WINDOWS"].push_back(window);
			}

			floor["ROOMS"].push_back(room);
		}

		if (f->stair != nullptr) {
			json stair = json::object();

			stair["DIRECTION"] = f->stair->direction;
			stair["POSITION"] = {
				{ f->stair->position.a.x, f->stair->position.a.y },
				{ f->stair->position.b.x, f->stair->position.b.y }
			};

			floor["STAIR"] = stair;
		}

		j["FLOORS"].push_back(floor);
	}

	return j;
}