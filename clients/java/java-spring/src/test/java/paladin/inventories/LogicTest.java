package paladin.inventories;


import static org.junit.Assert.assertEquals;

import java.util.Arrays;
import java.util.List;
import java.util.stream.IntStream;

import org.junit.Before;
import org.junit.Test;

import paladin.inventories.gilded_rose.Item;
import paladin.inventories.gilded_rose.Order;

public class LogicTest {
	
	Logic logic;
	
	@Before
	public void setup() {
		logic = new Logic();
	}
	
	@Test
	public void testAgedBrie() {
		Order order = new Order();
		order.setItems( items(
			item("Aged Brie", 6, 7),
			item("Aged Brie", 3, 1)
		));
		order.setDaysElapsed(2);
		List<Item> result = logic.applyLogic(order);
		List<Item> expected = items(
			item("Aged Brie", 4, 9),
			item("Aged Brie", 1, 3)
		);
		assertEquals( result.size(), expected.size() );
		IntStream.range(0, expected.size())
			.forEach( i -> assertSameItem(i, expected.get(i), result.get(i))  );
	}

	private void assertSameItem(int i, Item expected, Item item) {
		String message = "item["+i+"] differs";
		assertEquals( message, expected.getName(), item.getName() );
		assertEquals( message, expected.getSellIn(), item.getSellIn() );
		assertEquals( message, expected.getQuality(), item.getQuality() );
	}

	private List<Item> items(Item... items) {
		return Arrays.asList(items);
	}
	
	private Item item(String name, int sellIn, int quality) {
		Item item = new Item();
		item.setName(name);
		item.setSellIn(sellIn);
		item.setQuality(quality);
		return item;
	}

}
