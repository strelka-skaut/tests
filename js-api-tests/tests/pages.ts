import "dotenv/config";

import { test } from "uvu";
import { strict as assert } from "assert";
import { makeUuid, Pages, PagesClient } from "@strelka-skaut/js-api-client";
import faker from "@faker-js/faker";
import Bluebird from "bluebird";
const { lorem } = faker;

if(!process.env["API_ENDPOINT"])
	throw new Error("Missing API_ENDPOINT environment variable.")

const pagesClient = new PagesClient.ServiceClient(process.env["API_ENDPOINT"]);

test("createPage, getPage, deletePage", async () => {
	let createReq = new Pages.CreatePageRequest;
	createReq.setName(lorem.words()).setSlug(lorem.slug()).setContent(lorem.paragraph());
	let createRes = await pagesClient.createPage(createReq, {});
	let pageId = createRes.getId();
	assert.ok(pageId);

	let getReq = new Pages.GetPageRequest;
	getReq.setPageId(pageId);
	let getRes = await pagesClient.getPage(getReq, {});
	assert.ok(getRes.hasPage());
	assert.equal(getRes.getPage()?.getName(), createReq.getName());
	assert.equal(getRes.getPage()?.getSlug(), createReq.getSlug());
	assert.equal(getRes.getPage()?.getContent(), createReq.getContent());

	let deleteReq = new Pages.DeletePageRequest;
	deleteReq.setPageId(pageId);
	let deleteRes = await pagesClient.deletePage(deleteReq, {});
});

function createSamplePage() {
	return Bluebird.try(async () => {
		let createReq = new Pages.CreatePageRequest;
		createReq.setName(lorem.words()).setSlug(lorem.slug()).setContent(lorem.paragraph());
		let createRes = await pagesClient.createPage(createReq, {});
		let getReq = new Pages.GetPageRequest;
		getReq.setPageId(createRes.getId());
		let getRes = await pagesClient.getPage(getReq, {});
		assert.ok(getRes.getPage());
		return getRes.getPage() as Pages.Page;
	}).disposer(async (page: Pages.Page) => {
		let deleteReq = new Pages.DeletePageRequest;
		deleteReq.setPageId(page.getId());
		await pagesClient.deletePage(deleteReq, {});
	});
}

test("createPage - unique slug", async () => {
	await Bluebird.using(createSamplePage(), async (page) => {

		let createReq = new Pages.CreatePageRequest;
		createReq.setName(lorem.words()).setSlug(page.getSlug()).setContent(lorem.paragraph());
		await assert.rejects(async () => {
			await pagesClient.createPage(createReq, {});
		});

	});
});

test("deletePage - nonexistent", async () => {
	let deleteReq = new Pages.DeletePageRequest;
	deleteReq.setPageId(makeUuid(faker.datatype.uuid()));

	await assert.rejects(async () => {
		await pagesClient.deletePage(deleteReq, {});
	});
});


// test("getPageBySlug", async () => {

// });

test.run();
