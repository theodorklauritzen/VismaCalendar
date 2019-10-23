import json

# https://www.akershus.no/ansvarsomrader/opplering/akershusoppleringen/visma-inschool/

TARGET_FILE = "schools.json"

afkSchoolString = """
<option value="https://asker-vgs.inschool.visma.no">Asker videregående skole</option>
<option value="https://bjertnes-vgs.inschool.visma.no">Bjertnes videregående skole</option>
<option value="https://bjorkelangen-vgs.inschool.visma.no">Bjørkelangen videregående skole</option>
<option value="https://bleiker-vgs.inschool.visma.no">Bleiker videregående skole</option>
<option value="https://dromtorp-vgs.inschool.visma.no">Drømtorp videregående skole</option>
<option value="https://donski-vgs.inschool.visma.no">Dønski videregående skole</option>
<option value="https://eidsvoll.inschool.visma.no">Eidsvoll videregående skole</option>
<option value="https://eikeli-vgs.inschool.visma.no">Eikeli videregående skole</option>
<option value="https://frogn-vgs.inschool.visma.no">Frogn videregående skole</option>
<option value="https://holmen-vgs.inschool.visma.no">Holmen videregående skole</option>
<option value="https://hvam-vgs.inschool.visma.no">Hvam videregående skole</option>
<option value="https://jessheim-vgs.inschool.visma.no">Jessheim videregående skole</option>
<option value="https://kjelle-vgs.inschool.visma.no">Kjelle videregående skole</option>
<option value="https://lillestrom-vgs.inschool.visma.no">Lillestrøm videregående skole</option>
<option value="https://lorenskog-vgs.inschool.visma.no">Lørenskog videregående skole</option>
<option value="https://mailand.inschool.visma.no">Mailand videregående skole</option>
<option value="https://nadderud-vgs.inschool.visma.no">Nadderud videregående skole</option>
<option value="https://nannestad-vgs.inschool.visma.no">Nannestad videregående skole</option>
<option value="https://nes-vgs.inschool.visma.no">Nes videregående skole</option>
<option value="https://nesbru-vgs.inschool.visma.no">Nesbru videregående skole</option>
<option value="https://nesodden-vgs.inschool.visma.no">Nesodden videregående skole</option>
<option value="https://roaldamundsen-vgs.inschool.visma.no">Roald Amundsen videregående skole</option>
<option value="https://rosenvilde-vgs.inschool.visma.no">Rosenvilde videregående skole</option>
<option value="https://rud-vgs.inschool.visma.no">Rud videregående skole</option>
<option value="https://raelingen-vgs.inschool.visma.no">Rælingen videregående skole</option>
<option value="https://sandvika-vgs.inschool.visma.no">Sandvika videregående skole</option>
<option value="https://skedsmo-vgs.inschool.visma.no">Skedsmo videregående skole</option>
<option value="https://ski-vgs.inschool.visma.no">Ski videregående skole</option>
<option value="https://solberg.inschool.visma.no">Solberg videregående skole</option>
<option value="https://stabekk-vgs.inschool.visma.no">Stabekk videregående skole</option>
<option value="https://strommen-vgs.inschool.visma.no">Strømmen videregående skole</option>
<option value="https://sorumsand-vgs.inschool.visma.no">Sørumsand videregående skole</option>
<option value="https://valler-vgs.inschool.visma.no">Valler videregående skole</option>
<option value="https://vestby-vgs.inschool.visma.no">Vestby videregående skole</option>
<option value="https://aas-vgs.inschool.visma.no">Ås videregående skole</option>
<option value="https://akershus.inschool.visma.no">Akershus skoleeier</option>
"""

otherSchools = [{
    'name': 'tryggheim',
    'displayname': 'Tryggheim',
    'link': 'https://tryggheim.inschool.visma.no'
}]

def extractData(s):
    link = s.split("\"")[1]
    name = s.split(">")[1].split("<")[0]
    ret = {
        "name": name,
        "link": link
    }
    return ret

def generateObject(schoolsString):
    ret = []
    s = schoolsString.split("\n")
    for i in s:
        if(i != ""):
            data = extractData(i)
            if(data['name'] != "Akershus skoleeier"):
                name = data['link'].split(".")[0][8:].split("-")[0]
                displayName = data['name'][:-19]
                link = data['link']

                ret.append({
                    'name': name,
                    'displayName': displayName,
                    'link': link
                })

    return ret

def sortSchools(school):
    return school['name']

def main():
    schools = generateObject(afkSchoolString)

    schools = schools + otherSchools

    schools.sort(key = sortSchools)

    with open(TARGET_FILE, 'w') as json_file:
        json.dump(schools, json_file)

if __name__ == "__main__":
    main()
